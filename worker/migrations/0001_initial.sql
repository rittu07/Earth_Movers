PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alt_phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  email TEXT DEFAULT '',
  gst TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  vehicle_code TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL,
  registration_number TEXT DEFAULT '',
  model TEXT DEFAULT '',
  capacity TEXT DEFAULT '',
  fuel_type TEXT DEFAULT 'Diesel',
  current_meter REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active',
  driver_name TEXT DEFAULT '',
  driver_phone TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  contact_person TEXT DEFAULT '',
  location TEXT DEFAULT '',
  default_cost_per_brick REAL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  vehicle_id TEXT,
  business_id TEXT NOT NULL,
  item_service TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'Units',
  rate REAL NOT NULL DEFAULT 0,
  amount REAL NOT NULL DEFAULT 0,
  paid REAL NOT NULL DEFAULT 0,
  due REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  date TEXT NOT NULL,
  driver_name TEXT DEFAULT '',
  driver_phone TEXT DEFAULT '',
  driver_amount REAL DEFAULT 0,
  duration REAL DEFAULT 0,
  start_time TEXT DEFAULT '',
  end_time TEXT DEFAULT '',
  jcb_vehicle TEXT DEFAULT '',
  is_outsourced INTEGER NOT NULL DEFAULT 0,
  outsourced_supplier TEXT DEFAULT '',
  outsourced_phone TEXT DEFAULT '',
  outsourced_brick_qty REAL DEFAULT 0,
  outsourced_cost_per_brick REAL DEFAULT 0,
  outsourced_cost REAL DEFAULT 0,
  outsourced_paid REAL DEFAULT 0,
  outsourced_due REAL DEFAULT 0,
  water_source TEXT DEFAULT '',
  delivery_place TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  customer_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  amount REAL NOT NULL,
  method TEXT NOT NULL DEFAULT 'Cash',
  reference TEXT DEFAULT '',
  date TEXT NOT NULL,
  related_transaction TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  business_id TEXT NOT NULL,
  business_name TEXT DEFAULT '',
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT NOT NULL DEFAULT 'Cash',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS diesel_logs (
  id TEXT PRIMARY KEY,
  jcb_vehicle TEXT NOT NULL,
  date TEXT NOT NULL,
  quantity REAL NOT NULL,
  price_per_litre REAL NOT NULL,
  total_cost REAL NOT NULL,
  hour_meter_reading REAL NOT NULL,
  bunk_name TEXT DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS finance_loans (
  id TEXT PRIMARY KEY,
  borrower_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  principal REAL NOT NULL,
  interest_rate REAL NOT NULL,
  start_date TEXT NOT NULL,
  months INTEGER NOT NULL,
  monthly_interest REAL NOT NULL,
  total_interest REAL NOT NULL,
  total_amount REAL NOT NULL,
  returned_amount REAL NOT NULL DEFAULT 0,
  due_amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_events (
  event_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_created_at TEXT NOT NULL,
  received_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_sync_events_client ON sync_events(client_id, client_created_at);
