import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
const MAX_EVENTS = 100;
const MAX_REQUEST_BYTES = 512 * 1024;
const MAX_EVENT_BYTES = 128 * 1024;
const MAX_ID_LENGTH = 128;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigin = c.env.ALLOWED_ORIGIN;
    return allowedOrigin && origin === allowedOrigin ? allowedOrigin : '';
  },
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Token', 'X-Setup-Key'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.header('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if (new URL(c.req.url).protocol === 'https:') c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
});

app.use('/api/*', async (c, next) => {
  const path = c.req.path;
  const contentLength = Number(c.req.header('Content-Length') || 0);
  if (contentLength > MAX_REQUEST_BYTES) return c.json({ error: 'Request too large' }, 413);

  if (path === '/api/auth/login' || path === '/api/auth/setup') {
    return next();
  }

  const user = await getSessionUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  c.set('user', user);
  await next();
});

const now = () => new Date().toISOString();
const value = (object, key, fallback = '') => object[key] ?? fallback;
const number = (object, key, fallback = 0) => Number(object[key] ?? fallback) || 0;

const bytesToBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
const base64ToBytes = (value) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
const bytesToHex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

const randomBase64 = (length = 32) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes);
};

const sha256 = async (value) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
};

const hashPassword = async (password, salt) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: base64ToBytes(salt), iterations: 100000, hash: 'SHA-256' },
    key,
    256
  );
  return bytesToHex(new Uint8Array(bits));
};

const safeUsername = (value) => String(value || '').trim().toLowerCase();
const validPassword = (value) => typeof value === 'string' && value.length >= 8 && value.length <= 128;

async function getSessionUser(c) {
  const authorization = c.req.header('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token || !c.env.DB) return null;

  const tokenHash = await sha256(token);
  const session = await c.env.DB.prepare(
    `SELECT s.expires_at, u.id, u.username, u.role
     FROM auth_sessions s JOIN auth_users u ON u.id = s.user_id
     WHERE s.token_hash = ?`
  ).bind(tokenHash).first();
  if (!session || new Date(session.expires_at).getTime() <= Date.now()) {
    if (session) await c.env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(tokenHash).run();
    return null;
  }
  return { id: session.id, username: session.username, role: session.role };
}

const publicUser = (user) => ({ id: user.id, username: user.username, role: user.role });

app.post('/api/auth/setup', async (c) => {
  if (!c.env.AUTH_SETUP_KEY || c.req.header('X-Setup-Key') !== c.env.AUTH_SETUP_KEY) {
    return c.json({ error: 'Invalid setup key' }, 401);
  }

  try {

  const body = await c.req.json().catch(() => null);
  const owner = body?.owner;
  const manager = body?.manager;
  if (!owner || !manager || !validPassword(owner.password) || !validPassword(manager.password)) {
    return c.json({ error: 'Owner and manager usernames and passwords are required; passwords must be 8-128 characters' }, 400);
  }

  const existing = await c.env.DB.prepare('SELECT COUNT(*) AS count FROM auth_users').first();
  if (Number(existing?.count || 0) > 0) return c.json({ error: 'Authentication is already configured' }, 409);

  const users = [
    { id: crypto.randomUUID(), username: safeUsername(owner.username), password: owner.password, role: 'owner' },
    { id: crypto.randomUUID(), username: safeUsername(manager.username), password: manager.password, role: 'manager' }
  ];
  if (users.some((user) => !user.username || user.username.length > 64) || users[0].username === users[1].username) {
    return c.json({ error: 'Owner and manager usernames must be unique and valid' }, 400);
  }

  const timestamp = now();
  const statements = [];
  for (const user of users) {
    const salt = randomBase64(16);
    const passwordHash = await hashPassword(user.password, salt);
    statements.push(c.env.DB.prepare(
      'INSERT INTO auth_users (id, username, password_hash, password_salt, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(user.id, user.username, passwordHash, salt, user.role, timestamp, timestamp));
  }
    await c.env.DB.batch(statements);
    return c.json({ created: users.map(publicUser) }, 201);
  } catch (error) {
    console.error('Authentication setup failed', error);
    return c.json({ error: 'Authentication setup failed' }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const username = safeUsername(body?.username);
  const password = body?.password;
  const requestedRole = body?.role;
  if (!username || !validPassword(password) || !['owner', 'manager'].includes(requestedRole)) {
    return c.json({ error: 'Invalid username, password, or role' }, 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT id, username, password_hash, password_salt, role FROM auth_users WHERE username = ?'
  ).bind(username).first();
  if (!user || user.role !== requestedRole) return c.json({ error: 'Invalid credentials' }, 401);

  const passwordHash = await hashPassword(password, user.password_salt);
  if (passwordHash !== user.password_hash) return c.json({ error: 'Invalid credentials' }, 401);

  await c.env.DB.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').bind(now()).run();
  const rawToken = randomBase64(32);
  const tokenHash = await sha256(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await c.env.DB.prepare(
    'INSERT INTO auth_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).bind(tokenHash, user.id, expiresAt, now()).run();
  return c.json({ token: rawToken, expiresAt, user: publicUser(user) });
});

app.get('/api/auth/me', (c) => c.json({ user: publicUser(c.get('user')) }));

app.post('/api/auth/logout', async (c) => {
  const token = (c.req.header('Authorization') || '').slice(7);
  if (token) await c.env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  return c.json({ ok: true });
});

const tableFor = {
  customer: 'customers',
  transaction: 'transactions',
  payment: 'payments',
  expense: 'expenses',
  dieselLog: 'diesel_logs',
  supplier: 'suppliers',
  financeLoan: 'finance_loans',
  staff: 'staff',
  drivingHour: 'driving_hours',
  jcbFleet: 'jcb_fleet',
  maintenanceRecord: 'maintenance_records',
  jcbDocument: 'jcb_documents',
  stockEntry: 'stock_entries'
};

const jsonEntityTypes = new Set(['staff', 'drivingHour', 'jcbFleet', 'maintenanceRecord', 'jcbDocument', 'stockEntry']);
const allowedOperations = new Set(['create', 'update', 'delete']);
const canWriteEntity = (user, entityType) => user.role === 'owner' || entityType !== 'financeLoan';

const validEvent = (event) => {
  if (!event || typeof event !== 'object' || Array.isArray(event)) return false;
  if (!event.eventId || typeof event.eventId !== 'string' || event.eventId.length > MAX_ID_LENGTH) return false;
  if (!event.entityType || typeof event.entityType !== 'string' || !tableFor[event.entityType]) return false;
  if (!event.entityId || typeof event.entityId !== 'string' || event.entityId.length > MAX_ID_LENGTH) return false;
  if (!allowedOperations.has(event.operation || 'create')) return false;
  if (event.operation !== 'delete' && (!event.payload || typeof event.payload !== 'object' || Array.isArray(event.payload))) return false;
  if (event.clientId && (typeof event.clientId !== 'string' || event.clientId.length > MAX_ID_LENGTH)) return false;
  return JSON.stringify(event).length <= MAX_EVENT_BYTES;
};

function entityStatement(event, receivedAt) {
  const data = event.payload;
  const table = tableFor[event.entityType];
  if (!table) return null;

  if (event.operation === 'delete') {
    return { sql: `DELETE FROM ${table} WHERE id = ?`, bindings: [event.entityId] };
  }

  if (event.operation !== 'create' && event.operation !== 'update') return null;

  if (jsonEntityTypes.has(event.entityType)) {
    return {
      sql: `INSERT INTO ${table} (id,payload,created_at,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at`,
      bindings: [event.entityId, JSON.stringify(data), value(data, 'createdAt', receivedAt), receivedAt]
    };
  }

  if (event.entityType === 'customer') {
    return {
      sql: `INSERT INTO customers (id,name,phone,alt_phone,address,email,gst,status,notes,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=excluded.phone,alt_phone=excluded.alt_phone,address=excluded.address,email=excluded.email,gst=excluded.gst,status=excluded.status,notes=excluded.notes,updated_at=excluded.updated_at`,
      bindings: [event.entityId, value(data, 'name'), value(data, 'phone'), value(data, 'altPhone'), value(data, 'address'), value(data, 'email'), value(data, 'gst'), value(data, 'status', 'Active'), value(data, 'notes'), value(data, 'createdAt', receivedAt), receivedAt]
    };
  }

  if (event.entityType === 'transaction') {
    return {
      sql: `INSERT INTO transactions (id,customer_id,vehicle_id,business_id,item_service,quantity,unit,rate,amount,paid,due,status,payment_method,date,driver_name,driver_phone,driver_amount,duration,start_time,end_time,jcb_vehicle,is_outsourced,outsourced_supplier,outsourced_phone,outsourced_brick_qty,outsourced_cost_per_brick,outsourced_cost,outsourced_paid,outsourced_due,water_source,delivery_place,notes,created_at,updated_at)
        VALUES (${Array(34).fill('?').join(',')}) ON CONFLICT(id) DO UPDATE SET customer_id=excluded.customer_id,vehicle_id=excluded.vehicle_id,business_id=excluded.business_id,item_service=excluded.item_service,quantity=excluded.quantity,unit=excluded.unit,rate=excluded.rate,amount=excluded.amount,paid=excluded.paid,due=excluded.due,status=excluded.status,payment_method=excluded.payment_method,date=excluded.date,driver_name=excluded.driver_name,driver_phone=excluded.driver_phone,driver_amount=excluded.driver_amount,duration=excluded.duration,start_time=excluded.start_time,end_time=excluded.end_time,jcb_vehicle=excluded.jcb_vehicle,is_outsourced=excluded.is_outsourced,outsourced_supplier=excluded.outsourced_supplier,outsourced_phone=excluded.outsourced_phone,outsourced_brick_qty=excluded.outsourced_brick_qty,outsourced_cost_per_brick=excluded.outsourced_cost_per_brick,outsourced_cost=excluded.outsourced_cost,outsourced_paid=excluded.outsourced_paid,outsourced_due=excluded.outsourced_due,water_source=excluded.water_source,delivery_place=excluded.delivery_place,notes=excluded.notes,updated_at=excluded.updated_at`,
      bindings: [event.entityId, value(data, 'customerId', null), value(data, 'vehicleId', null), value(data, 'businessId'), value(data, 'itemService'), number(data, 'quantity', 1), value(data, 'unit', 'Units'), number(data, 'rate'), number(data, 'amount'), number(data, 'paid'), number(data, 'due'), value(data, 'status', 'Pending'), value(data, 'paymentMethod', 'Cash'), value(data, 'date'), value(data, 'driverName'), value(data, 'driverPhone'), number(data, 'driverAmount'), number(data, 'duration'), value(data, 'startTime'), value(data, 'endTime'), value(data, 'jcbVehicle'), data.isOutsourced ? 1 : 0, value(data, 'outsourcedSupplier'), value(data, 'outsourcedPhone'), number(data, 'outsourcedBrickQty'), number(data, 'outsourcedCostPerBrick'), number(data, 'outsourcedCost'), number(data, 'outsourcedPaid'), number(data, 'outsourcedDue'), value(data, 'waterSource'), value(data, 'deliveryPlace'), value(data, 'notes'), value(data, 'createdAt', receivedAt), receivedAt]
    };
  }

  const columns = {
    payment: ['customer_id','customer_name','phone','amount','method','reference','date','related_transaction','notes'],
    expense: ['date','category','business_id','business_name','description','amount','method','notes'],
    dieselLog: ['jcb_vehicle','date','quantity','price_per_litre','total_cost','hour_meter_reading','bunk_name','payment_method','notes'],
    supplier: ['name','phone','contact_person','location','default_cost_per_brick','notes'],
    financeLoan: ['borrower_name','phone','principal','interest_rate','start_date','months','monthly_interest','total_interest','total_amount','returned_amount','due_amount','status','notes','payment_history']
  }[event.entityType];
  const mappings = {
    customer_name: 'customerName', related_transaction: 'relatedTransaction', business_id: 'businessId', business_name: 'businessName', jcb_vehicle: 'jcbVehicle', price_per_litre: 'pricePerLitre', total_cost: 'totalCost', hour_meter_reading: 'hourMeterReading', bunk_name: 'bunkName', payment_method: 'paymentMethod', contact_person: 'contactPerson', default_cost_per_brick: 'defaultCostPerBrick',     borrower_name: 'borrowerName', interest_rate: 'interestRate', start_date: 'startDate', monthly_interest: 'monthlyInterest', total_interest: 'totalInterest', total_amount: 'totalAmount', returned_amount: 'returnedAmount', due_amount: 'dueAmount', payment_history: 'paymentHistory'
  };
  const bindings = columns.map((column) => {
    const key = mappings[column] || column;
    if (key === 'paymentHistory') return JSON.stringify(data[key] || []);
    return data[key] ?? (['amount','quantity','pricePerLitre','totalCost','hourMeterReading','defaultCostPerBrick','principal','interestRate','months','monthlyInterest','totalInterest','totalAmount','returnedAmount','dueAmount'].includes(key) ? 0 : '');
  });
  const hasUpdatedAt = event.entityType === 'supplier' || event.entityType === 'financeLoan';
  const allColumns = ['id', ...columns, 'created_at', ...(hasUpdatedAt ? ['updated_at'] : [])];
  const updateClauses = [...columns, ...(hasUpdatedAt ? ['updated_at'] : [])].map((col) => `${col}=excluded.${col}`).join(',');
  const timestamps = [value(data, 'createdAt', receivedAt), ...(hasUpdatedAt ? [receivedAt] : [])];
  return { sql: `INSERT INTO ${table} (${allColumns.join(',')}) VALUES (${allColumns.map(() => '?').join(',')}) ON CONFLICT(id) DO UPDATE SET ${updateClauses}`, bindings: [event.entityId, ...bindings, ...timestamps] };
}

app.post('/api/sync', async (c) => {
  const body = await c.req.json().catch(() => null);
  const events = Array.isArray(body) ? body : body?.events;
  if (!Array.isArray(events) || events.length > MAX_EVENTS) return c.json({ error: `events must contain 1-${MAX_EVENTS} items` }, 400);

  const receivedAt = now();
  const statements = [];
  const accepted = [];
  const rejected = [];
  for (const event of events) {
    if (!validEvent(event)) {
      rejected.push({ eventId: event?.eventId || null, reason: 'Invalid event' });
      continue;
    }
    if (event.accountId !== c.get('user').id) {
      rejected.push({ eventId: event.eventId, reason: 'Event account does not match session' });
      continue;
    }
    if (!canWriteEntity(c.get('user'), event.entityType)) {
      rejected.push({ eventId: event.eventId, reason: 'Managers cannot access finance records' });
      continue;
    }
    const existing = await c.env.DB.prepare('SELECT event_id FROM sync_events WHERE event_id = ?').bind(event.eventId).first();
    if (existing) { accepted.push(event.eventId); continue; }
    const entity = entityStatement(event, receivedAt);
    if (!entity) { rejected.push({ eventId: event.eventId, reason: 'Unsupported entity or operation' }); continue; }
    statements.push(c.env.DB.prepare(entity.sql).bind(...entity.bindings));
    statements.push(c.env.DB.prepare('INSERT INTO sync_events (event_id,entity_type,entity_id,operation,payload,client_id,client_created_at,received_at) VALUES (?,?,?,?,?,?,?,?)').bind(event.eventId, event.entityType, event.entityId, event.operation || 'create', JSON.stringify(event.payload), event.clientId || 'unknown', event.clientCreatedAt || receivedAt, receivedAt));
    accepted.push(event.eventId);
  }
  if (statements.length) await c.env.DB.batch(statements);
  return c.json({ accepted, rejected, receivedAt });
});

app.get('/api/sync', async (c) => {
  const since = c.req.query('since') || '';
  const clientId = c.req.query('clientId');
  const financeFilter = c.get('user').role === 'manager' ? " AND entity_type != 'financeLoan'" : '';
  const query = clientId
    ? `SELECT * FROM sync_events WHERE client_id != ? AND received_at > ?${financeFilter} ORDER BY received_at LIMIT 500`
    : `SELECT * FROM sync_events WHERE received_at > ?${financeFilter} ORDER BY received_at LIMIT 500`;
  const result = clientId ? await c.env.DB.prepare(query).bind(clientId, since).all() : await c.env.DB.prepare(query).bind(since).all();
  return c.json({ events: result.results || [], nextSince: now() });
});

for (const [path, table] of Object.entries(tableFor)) {
  const endpoint = path === 'dieselLog'
    ? 'diesel-logs'
    : path === 'staff'
      ? 'staff'
      : `${path.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}s`;
  app.get(`/api/${endpoint}`, async (c) => {
    if (path === 'financeLoan' && c.get('user').role !== 'owner') {
      return c.json({ error: 'Finance access is restricted to owners' }, 403);
    }
    const result = await c.env.DB.prepare(`SELECT * FROM ${table} ORDER BY rowid DESC LIMIT 500`).all();
    return c.json({ data: result.results || [] });
  });
}

app.get('/health', (c) => c.json({ service: 'earth-movers-api', status: 'ok' }));

// Serve the built React app from the same Worker URL as the API.
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
