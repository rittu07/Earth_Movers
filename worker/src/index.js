import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
const MAX_EVENTS = 100;

app.use('*', cors({ origin: '*' }));

app.use('/api/*', async (c, next) => {
  const configuredToken = c.env.API_TOKEN;
  if (configuredToken && c.req.header('Authorization') !== `Bearer ${configuredToken}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

const now = () => new Date().toISOString();
const value = (object, key, fallback = '') => object[key] ?? fallback;
const number = (object, key, fallback = 0) => Number(object[key] ?? fallback) || 0;

const tableFor = {
  customer: 'customers',
  transaction: 'transactions',
  payment: 'payments',
  expense: 'expenses',
  dieselLog: 'diesel_logs',
  supplier: 'suppliers',
  financeLoan: 'finance_loans'
};

function entityStatement(event, receivedAt) {
  const data = event.payload;
  const table = tableFor[event.entityType];
  if (!table) return null;

  if (event.operation === 'delete') {
    return { sql: `DELETE FROM ${table} WHERE id = ?`, bindings: [event.entityId] };
  }

  if (event.operation !== 'create' && event.operation !== 'update') return null;

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
  const allColumns = ['id', ...columns, 'created_at'];
  const updateClauses = columns.map((col) => `${col}=excluded.${col}`).join(',');
  return { sql: `INSERT INTO ${table} (${allColumns.join(',')}) VALUES (${allColumns.map(() => '?').join(',')}) ON CONFLICT(id) DO UPDATE SET ${updateClauses}`, bindings: [event.entityId, ...bindings, value(data, 'createdAt', receivedAt)] };
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
    if (!event?.eventId || !event?.entityType || !event?.entityId || !event?.payload) {
      rejected.push({ eventId: event?.eventId || null, reason: 'Invalid event' });
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
  const query = clientId
    ? 'SELECT * FROM sync_events WHERE client_id != ? AND received_at > ? ORDER BY received_at LIMIT 500'
    : 'SELECT * FROM sync_events WHERE received_at > ? ORDER BY received_at LIMIT 500';
  const result = clientId ? await c.env.DB.prepare(query).bind(clientId, since).all() : await c.env.DB.prepare(query).bind(since).all();
  return c.json({ events: result.results || [], nextSince: now() });
});

for (const [path, table] of Object.entries(tableFor)) {
  app.get(`/api/${path === 'dieselLog' ? 'diesel-logs' : path.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}s`, async (c) => {
    const result = await c.env.DB.prepare(`SELECT * FROM ${table} ORDER BY rowid DESC LIMIT 500`).all();
    return c.json({ data: result.results || [] });
  });
}

app.get('/health', (c) => c.json({ service: 'earth-movers-api', status: 'ok' }));

// Serve the built React app from the same Worker URL as the API.
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
