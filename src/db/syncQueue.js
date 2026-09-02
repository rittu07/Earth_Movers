import { getAllLocal, getMeta, putLocal, deleteLocal } from './localDb';

const API_URL = import.meta.env.VITE_API_URL || '';
const API_TOKEN = import.meta.env.VITE_API_TOKEN || '';
const CLIENT_ID_KEY = 'earth-movers-client-id';

const getClientId = () => {
  let clientId = localStorage.getItem(CLIENT_ID_KEY);
  if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }
  return clientId;
};

export const queueEntity = async (entityType, entity, operation = 'create') => {
  const event = {
    id: crypto.randomUUID(),
    eventId: crypto.randomUUID(),
    entityType,
    entityId: entity.id,
    operation,
    payload: entity,
    clientId: getClientId(),
    clientCreatedAt: new Date().toISOString()
  };
  await putLocal('syncQueue', event);
  return event;
};

export const flushSyncQueue = async () => {
  if (!API_URL || !navigator.onLine) return { synced: 0, pending: (await getAllLocal('syncQueue')).length };
  const pending = await getAllLocal('syncQueue');
  if (!pending.length) return { synced: 0, pending: 0 };

  const headers = { 'Content-Type': 'application/json' };
  if (API_TOKEN) headers.Authorization = `Bearer ${API_TOKEN}`;
  const response = await fetch(`${API_URL}/api/sync`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ events: pending.map((item) => {
      const event = { ...item };
      delete event.id;
      return event;
    }) })
  });
  if (!response.ok) throw new Error(`Sync failed: ${response.status}`);
  const result = await response.json();
  for (const eventId of result.accepted || []) {
    const event = pending.find((item) => item.eventId === eventId);
    if (event) await deleteLocal('syncQueue', event.id);
  }
  return { synced: (result.accepted || []).length, pending: (await getAllLocal('syncQueue')).length };
};

const storeForEntity = {
  customer: 'customers',
  transaction: 'transactions',
  payment: 'payments',
  expense: 'expenses',
  dieselLog: 'dieselLogs',
  supplier: 'suppliers',
  financeLoan: 'financeLoans'
};

const pullRemoteChanges = async () => {
  if (!API_URL || !navigator.onLine) return { changed: false, pending: 0 };
  const clientId = getClientId();
  const cursor = (await getMeta('sync-cursor'))?.value || '';
  const headers = API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {};
  const response = await fetch(`${API_URL}/api/sync?clientId=${encodeURIComponent(clientId)}&since=${encodeURIComponent(cursor)}`, { headers });
  if (!response.ok) throw new Error(`Pull failed: ${response.status}`);
  const result = await response.json();
  for (const event of result.events || []) {
    const store = storeForEntity[event.entity_type];
    if (!store) continue;
    const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;
    if (event.operation === 'delete') await deleteLocal(store, event.entity_id);
    else await putLocal(store, payload);
  }
  await putLocal('meta', { id: 'sync-cursor', value: result.nextSince || new Date().toISOString() });
  return { changed: (result.events || []).length > 0, pending: (await getAllLocal('syncQueue')).length };
};

export const syncNow = async (onChange) => {
  try {
    const pushed = await flushSyncQueue();
    const pulled = await pullRemoteChanges();
    const result = { ...pushed, ...pulled, changed: pushed.synced > 0 || pulled.changed };
    onChange?.(result);
    return result;
  } catch {
    const result = { changed: false, error: true, pending: (await getAllLocal('syncQueue')).length };
    onChange?.(result);
    return result;
  }
};

let lastSyncTime = 0;
const SYNC_THROTTLE_MS = 15_000;

const throttledSync = (onChange) => {
  const now = Date.now();
  if (now - lastSyncTime < SYNC_THROTTLE_MS) return;
  lastSyncTime = now;
  syncNow(onChange);
};

export const startSync = (onChange) => {
  const sync = () => syncNow(onChange);
  const throttled = () => throttledSync(onChange);

  window.addEventListener('online', sync);
  document.addEventListener('visibilitychange', throttled);
  window.addEventListener('focus', throttled);
  window.addEventListener('pageshow', throttled);

  const interval = window.setInterval(sync, 5 * 60 * 1000);
  sync();

  return () => {
    window.removeEventListener('online', sync);
    document.removeEventListener('visibilitychange', throttled);
    window.removeEventListener('focus', throttled);
    window.removeEventListener('pageshow', throttled);
    window.clearInterval(interval);
  };
};
