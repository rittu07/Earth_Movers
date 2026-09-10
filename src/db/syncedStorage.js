import { deleteLocal, getAllLocal, putLocal } from './localDb';
import { queueEntity, syncNow } from './syncQueue';

export const loadSyncedCollection = async (store, legacyKey) => {
  const local = await getAllLocal(store);
  if (local.length || !legacyKey) return local;

  try {
    const legacy = localStorage.getItem(legacyKey);
    if (!legacy) return [];
    const values = JSON.parse(legacy);
    if (!Array.isArray(values)) return [];
    await Promise.all(values.map((value) => saveSyncedEntity(store, entityTypeForStore(store), value)));
    localStorage.removeItem(legacyKey);
    return values;
  } catch {
    return [];
  }
};

export const entityTypeForStore = (store) => ({
  jcbFleet: 'jcbFleet',
  maintenanceRecords: 'maintenanceRecord',
  jcbDocuments: 'jcbDocument',
  stockEntries: 'stockEntry'
}[store]);

export const saveSyncedEntity = async (store, entityType, entity, operation = 'update') => {
  if (operation === 'delete') await deleteLocal(store, entity.id);
  else await putLocal(store, entity);
  await queueEntity(entityType, entity, operation);
  return syncNow();
};

export const saveSyncedCollection = async (store, entityType, values) => {
  await Promise.all(values.map((value) => saveSyncedEntity(store, entityType, value)));
};
