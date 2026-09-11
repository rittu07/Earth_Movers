# Earth Movers — Rural Transport Business Ledger

A full-stack offline-first business ledger application for rural transport operations (Bricks, JCB Rental, Water Supply, Jalli Service, Sand Supply). Built with React + Cloudflare Workers + D1 (SQLite).

**Live App:** [https://earth-movers-api.loga.workers.dev](https://earth-movers-api.loga.workers.dev)

---

## Features

### Business Management
- **5 Business Units** — Bricks Supply, JCB Rental, Water Supply, Jalli Service, Sand Supply
- **Customer Management** — Add, view, and track all customers with contact details
- **Transaction Tracking** — Quick-entry spreadsheet-style form for logging sales
- **Payment Recording** — Track partial payments, outstanding dues, and payment methods (Cash / UPI / Bank Transfer)
- **Expense Tracking** — Record and categorize business expenses per unit
- **Supplier Management** — Manage material suppliers with inline "Add New Supplier" toggle (same UX as customer entry)
- **Outsourced Material Tracking** — Flag transactions as outsourced with supplier details for Bricks/Jalli/Sand

### Financial Tools
- **Finance Loan Ledger** — Track loans given to people with principal, interest rate, tenure, and monthly breakdowns
- **Record Return Payments** — Log repayments with month selection, editable tenure, and payment history
- **Auto-Calculate Interest** — Real-time interest and total payable preview when creating loans
- **Customer Ledger** — Per-customer chronological view of all transactions and payments
- **Business Ledger** — Unified event log across all business units

### Reports & Dashboard
- **Real-Time Dashboard** — Today's income, expenses, outstanding, and profit calculated from synced data
- **Business Performance Chart** — Donut chart showing income distribution across business units
- **Revenue Trend Chart** — 7-day line chart of income vs expenses
- **Reports Page** — Filterable by today / week / month / year with summary cards and per-business breakdown

### Sync & Offline
- **Offline-First** — All data stored in IndexedDB first; works without internet
- **Background Sync** — Automatic push/pull every 5 minutes
- **Mobile Sync** — Sync triggers on `visibilitychange`, `focus`, `pageshow` events so mobile browsers sync when returning from background
- **Immediate Sync** — Every save triggers an instant sync attempt
- **Reconnect Sync** — Syncs automatically when browser comes back online
- **Conflict-Free** — Append-only event log with idempotent upserts (event_id dedup)

### Operational Records
- **Stock In** — Bricks, Sand, and Jalli stock-in records are saved to IndexedDB and synced to D1 `stock_entries` when the Stock In form is submitted
- **JCB Operations** — Fleet, maintenance, document, diesel, and driving-hours records use the same local-first sync path
- **Driving Hours** — Driver hours are stored locally and remotely in `driving_hours` for monthly summaries and Bata calculations

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                    Frontend                       │
│  React + Vite + TailwindCSS + Recharts           │
│                                                   │
│  ┌──────────────┐    ┌────────────────────────┐  │
│  │  BusinessContext│   │  IndexedDB (localDb.js)│  │
│  │  (React State) │──▶│  customers, transactions│  │
│  │                │   │  payments, expenses ...  │  │
│  └──────┬────────┘    └───────────┬────────────┘  │
│         │                         │                │
│         ▼                         ▼                │
│  ┌──────────────┐    ┌────────────────────────┐  │
│  │  UI Pages     │    │  syncQueue.js           │  │
│  │  Dashboard,   │    │  queueEntity()          │  │
│  │  Transactions,│    │  flushSyncQueue()       │  │
│  │  Reports ...  │    │  pullRemoteChanges()    │  │
│  └──────────────┘    └───────────┬────────────┘  │
└──────────────────────────────────┼────────────────┘
                                   │ HTTPS
                                   ▼
┌─────────────────────────────────────────────────┐
│           Cloudflare Worker (Hono)               │
│  earth-movers-api.loga.workers.dev               │
│                                                   │
│  POST /api/sync   — Accept sync events            │
│  GET  /api/sync   — Pull events for other clients │
│  GET  /api/*      — Entity read endpoints          │
│  ALL  *           — Serve React SPA (ASSETS)       │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Cloudflare D1 (SQLite)               │
│  customers, transactions, payments, expenses,     │
│  diesel_logs, suppliers, finance_loans, staff,     │
│  jcb_fleet, maintenance_records, jcb_documents,    │
│  stock_entries, driving_hours, sync_events          │
└─────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, TailwindCSS 4, Recharts |
| Backend | Cloudflare Workers, Hono |
| Database | Cloudflare D1 (SQLite) |
| Local Storage | IndexedDB |
| Routing | React Router v7 |
| Icons | Lucide React |
| Android | Capacitor (optional) |

---

## How Wrangler Works

[Wrangler](https://developers.cloudflare.com/workers/wrangler/) is Cloudflare's CLI tool for managing Workers, D1 databases, and deployments.

### Key Commands

| Command | What It Does |
|---------|-------------|
| `npx wrangler login` | Authenticate with your Cloudflare account |
| `npx wrangler d1 create <name>` | Create a new D1 database, returns `database_id` |
| `npx wrangler d1 migrations apply <db>` | Run SQL migrations against D1 |
| `npx wrangler d1 execute <db> --command "SQL"` | Run raw SQL against D1 |
| `npx wrangler deploy` | Deploy the Worker to Cloudflare |
| `npx wrangler dev` | Run Worker locally for development |

### How Deployment Works

1. `npm run build` — Vite builds the React app into `dist/`
2. `npm run db:migrate:remote` — Apply pending D1 migrations
3. `npm run worker:deploy` — Wrangler uploads the Worker code from `worker/src/index.js` and the `dist/` folder as static assets
4. The Worker serves both the API (`/api/*`) and the React SPA (everything else) from the same URL
5. The `ASSETS` binding in `wrangler.toml` tells Cloudflare to serve files from `dist/` as static assets

### wrangler.toml Explained

```toml
name = "earth-movers-api"        # Worker name
main = "src/index.js"            # Entry point
compatibility_date = "2026-09-01" # Runtime compatibility

[[d1_databases]]
binding = "DB"                   # Access via c.env.DB
database_name = "earth-movers-db"
database_id = "f69026ef-..."     # Unique DB identifier

[assets]
directory = "../dist"            # Frontend build output
binding = "ASSETS"               # Access via c.env.ASSETS
not_found_handling = "single-page-application"  # SPA fallback
```

---

## Sync System

### How It Works

1. **Local Write** — Every create/update/delete writes to IndexedDB immediately and queues a sync event. Existing operational browser data is migrated once into IndexedDB before it is synced.
2. **Push** — `flushSyncQueue()` sends all pending events to `POST /api/sync`
3. **Pull** — `pullRemoteChanges()` fetches events from other clients via `GET /api/sync?since=<cursor>`
4. **Dedup** — Each event has a unique `event_id`; D1 uses `ON CONFLICT DO NOTHING` on the `sync_events` table
5. **Upsert** — Entity data uses `ON CONFLICT(id) DO UPDATE SET` to merge changes

### Sync Events Table (D1)

```sql
CREATE TABLE sync_events (
  event_id TEXT PRIMARY KEY,       -- UUID, dedup key
  entity_type TEXT NOT NULL,       -- customer, transaction, etc.
  entity_id TEXT NOT NULL,         -- Business key (e.g. TRX-123)
  operation TEXT NOT NULL,         -- create, update, delete
  payload TEXT NOT NULL,           -- Full entity JSON
  client_id TEXT NOT NULL,         -- Browser UUID
  client_created_at TEXT NOT NULL,
  received_at TEXT NOT NULL
);
```

---

## Database Schema

### Customers
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (cust-{timestamp}) |
| name | TEXT | Customer name |
| phone | TEXT | Phone number |
| address, email, gst | TEXT | Optional details |
| status | TEXT | Active / Inactive |

### Transactions
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (TRX-{number}) |
| customer_id | TEXT | FK to customer |
| business_id | TEXT | bricks / jcb / water / jalli / sand |
| item_service | TEXT | What was delivered |
| quantity, unit, rate, amount | REAL | Line item values |
| paid, due | REAL | Payment tracking |
| is_outsourced | INTEGER | 0/1 flag |
| outsourced_supplier | TEXT | Supplier name if outsourced |
| date | TEXT | YYYY-MM-DD |

### Finance Loans
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (FIN-{number}) |
| borrower_name | TEXT | Person who took the loan |
| principal | REAL | Loan amount |
| interest_rate | REAL | Monthly interest % |
| months | INTEGER | Tenure (editable on repayment) |
| monthly_interest | REAL | Calculated |
| total_amount | REAL | Principal + total interest |
| returned_amount | REAL | Sum of all repayments |
| due_amount | REAL | Remaining balance |
| payment_history | TEXT | JSON array of repayments |
| status | TEXT | Active / Settled |

### Staff
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (`staff-{timestamp}`) |
| payload | TEXT | Full staff record JSON, including role, salary, bata, advances, and status |
| created_at, updated_at | TEXT | ISO 8601 timestamps |

### JCB Fleet
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (`jcb-*`) |
| payload | TEXT | Full vehicle record JSON, including registration, meter readings, service intervals, and history |
| created_at, updated_at | TEXT | ISO 8601 timestamps |

### Maintenance Records
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (`maint-*`) |
| payload | TEXT | Full maintenance record JSON, including service type, meter, invoice name, provider, cost, due meter, and notes |
| created_at, updated_at | TEXT | ISO 8601 timestamps |

### JCB Documents
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Vehicle primary key (`jcb-*`) |
| payload | TEXT | Vehicle document registry JSON, including insurance, permits, RC, warranty, expiry dates, and attachment names |
| created_at, updated_at | TEXT | ISO 8601 timestamps |

### Stock Entries
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (`stk-{business}-{timestamp}`) |
| payload | TEXT | Stock-in JSON, including business, source, material, quantity, rate, vehicle, quality, damage quantity, and cost |
| created_at, updated_at | TEXT | ISO 8601 timestamps |

### Schema Migrations

| Migration | Purpose |
|-----------|---------|
| `0001_initial.sql` | Core ledger, customers, transactions, payments, expenses, diesel, suppliers, finance, and sync events |
| `0002_add_payment_history.sql` | Finance-loan repayment history |
| `0003_add_operational_data.sql` | Staff, fleet, maintenance, document registry, and stock-in tables |
| `0004_add_auth.sql` | Owner/manager users and hashed session storage |
| `0005_add_driving_hours.sql` | Persistent driver driving-hours records |

---

## Deployment Guide

### Prerequisites
- Node.js 22+ (`nvm use 22`)
- Cloudflare account
- Wrangler CLI installed globally or via npx

### First-Time Setup

```bash
# Clone the repo
git clone https://github.com/rittu07/Earth_Movers.git
cd Earth_Movers

# Install dependencies
npm install
npm run worker:install

# Authenticate with Cloudflare
npx wrangler login

# Create D1 database (only first time)
cd worker
npx wrangler d1 create earth-movers-db
# Copy the database_id into wrangler.toml
cd ..

# Apply database migrations
npm run db:migrate:remote

# Configure environment
cp .env.example .env
# Edit .env with your Worker URL

# Build and deploy
npm run build
npm run worker:deploy
```

### Worker Secrets

Store the setup key as a Wrangler secret. Never commit it or place it in frontend environment variables:

```bash
npx wrangler secret put AUTH_SETUP_KEY --config worker/wrangler.toml
```

`VITE_API_TOKEN` is not a confidential secret because frontend build variables are visible in browser JavaScript. Authentication is enforced by the Worker session token and role checks.

### Subsequent Deployments

```bash
npm run build
npm run worker:deploy
```

This rebuilds the React app and deploys both the frontend and API in a single Worker.

### Running Locally

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Worker API
npm run worker:dev
```

---

## Project Structure

```
Earth_Movers/
├── src/
│   ├── components/
│   │   ├── common/ExcelQuickEntry.jsx    # Transaction/expense quick-entry form
│   │   ├── dashboard/                     # StatCard, BusinessPerformance, RevenueChart
│   │   ├── layout/Header.jsx, Sidebar.jsx
│   │   └── transactions/TransactionTable.jsx
│   ├── context/BusinessContext.jsx         # Global state + persistence + sync
│   ├── db/
│   │   ├── localDb.js                     # IndexedDB wrapper
│   │   └── syncQueue.js                   # Sync queue + push/pull logic
│   │   └── syncedStorage.js                # Operational data persistence + legacy migration
│   ├── pages/                             # All page components
│   ├── utils/
│   │   ├── calculations.js                # Report data, date ranges, metrics
│   │   └── formatCurrency.js              # Currency + date formatting
│   └── data/mockData.js                   # Seed data (not used in production)
├── worker/
│   ├── src/index.js                       # Hono API (sync + entity endpoints)
│   ├── wrangler.toml                      # Cloudflare Worker config
│   ├── migrations/
│   │   ├── 0001_initial.sql               # Core schema
│   │   └── 0002_add_payment_history.sql   # Finance loan payment history
│   │   └── 0003_add_operational_data.sql  # Operational data schema
│   │   └── 0004_add_auth.sql               # Authentication schema
│   │   └── 0005_add_driving_hours.sql      # Driving-hours schema
│   └── package.json
├── .env.example                           # Environment template
├── package.json                           # Scripts + dependencies
└── README.md
```

---

## Changes Made (Changelog)

### Backend & Sync
- Created Hono Worker API with `POST /api/sync`, `GET /api/sync`, and entity read endpoints
- Created D1 schema with all tables (customers, transactions, payments, expenses, diesel_logs, suppliers, finance_loans, staff, driving_hours, jcb_fleet, maintenance_records, jcb_documents, stock_entries, sync_events)
- Worker serves both frontend (via ASSETS binding) and API from the same URL
- Fixed transaction SQL placeholder count mismatch (35 to 34)
- Fixed Worker D1 upsert from `DO NOTHING` to `DO UPDATE SET` — updates now persist
- Added `DELETE` support for entity removals
- Added `payment_history` column to finance_loans (migration 0002)
- Worker serializes `paymentHistory` as JSON for D1 storage
- Added migration `0003_add_operational_data.sql` for staff, JCB fleet, maintenance records, vehicle documents, and stock entries
- Added migrations `0004_add_auth.sql` and `0005_add_driving_hours.sql` for server authentication and persistent driver-hours records
- Added Worker sync and read support for all operational entities
- Corrected create/update/delete event handling so deleted entities are removed from D1
- Operational modules now persist through IndexedDB and the Cloudflare sync queue instead of direct `localStorage` writes
- Stock In forms for Bricks, Sand, and Jalli persist each submitted record directly to IndexedDB and D1; deletes are synchronized as well
- Deployed applications use their Worker origin as the default API URL, so synchronization works without a production `.env` file

### Offline-First & Sync
- Created IndexedDB local storage layer (`localDb.js`) and sync queue (`syncQueue.js`)
- Connected all BusinessContext writes to IndexedDB + sync queue
- Added bidirectional sync: push local events, pull remote changes, reload context
- Added mobile sync: `visibilitychange`, `focus`, `pageshow` event listeners for background-to-foreground sync
- Added 15-second throttle on sync to prevent rapid-fire requests
- Immediate sync after every save; reconnect sync on `online` event
- Pending sync events are bound to the authenticated account and local business data is cleared on logout

### Finance Loan Module
- Full-screen "Give New Loan" form (replaces modal)
- Full-screen "Record Return Payment" form with:
  - Editable tenure (months) — recalculates interest and total on save
  - Month selector — auto-generated from loan start date + tenure
  - Payment history display — shows all past repayments with month labels
- Finance loans now persist to IndexedDB + sync to D1
- `recordReturnPayment`, `settleFinanceLoan`, `deleteFinanceLoan` now call `persist()`

### UI/UX Changes
- Supplier entry for Bricks/Jalli/Sand now matches customer entry UX (select existing / + New Supplier toggle with inline name + phone inputs)
- Material Source + Supplier fields integrated into the same grid row as Customer
- Reports, dashboard charts, and all business pages now calculate metrics from synced data (no more hardcoded mock values)
- All date filters (Transactions, Ledger, CustomerLedger) use dynamic date ranges instead of fixed dates
- Header date is dynamic instead of hardcoded

### Data & Reports
- `calculateReportData()` — centralized report calculations with date range filtering
- `calculateBusinessMetrics()` — per-business unit metrics (today income, monthly revenue, outstanding)
- `calculateSummaryMetrics()` — total income, expenses, outstanding across all transactions
- Reports page, BusinessPerformance donut, RevenueChart all use real data
- Dashboard overview metrics calculated from actual synced data

## Authentication

The app uses the Cloudflare Worker and D1 for server-side authentication. Passwords are PBKDF2-hashed with per-user salts in the Worker; plaintext passwords are never stored. Login returns a random bearer session token; only its SHA-256 hash is stored in D1. Sessions expire after 12 hours.

Roles:

- **Owner** — Full access, including Finance Loan records.
- **Manager** — Operational access without Finance Loan access.

Authorization is enforced by the Worker. Frontend route restrictions are only a UI convenience and are not the security boundary.

On logout, the browser session, IndexedDB business data, and pending sync queue are cleared to prevent account data from carrying over to another login.

### First-Time Authentication Setup

After applying migrations, configure a one-time setup secret and create the two accounts:

```bash
npx wrangler secret put AUTH_SETUP_KEY --config worker/wrangler.toml
curl -X POST https://earth-movers-api.loga.workers.dev/api/auth/setup \
  -H "Content-Type: application/json" \
  -H "X-Setup-Key: YOUR_SETUP_KEY" \
  -d '{"owner":{"username":"owner","password":"CHANGE_THIS_OWNER_PASSWORD"},"manager":{"username":"manager","password":"CHANGE_THIS_MANAGER_PASSWORD"}}'
```

Use passwords of at least 8 characters. The setup endpoint permanently disables itself after the first two accounts are created. Never put real passwords in shell history, source files, or README documentation.

## Security Controls

- Exact-origin CORS using `ALLOWED_ORIGIN`; unknown browser origins are rejected.
- Security response headers including CSP, HSTS, frame protection, referrer policy, and content-type protection.
- Server-side role checks for Finance and sync writes.
- Request and sync-event size limits.
- Account-bound pending sync events.
- Parameterized D1 queries and a static entity-to-table allowlist.
- Expired sessions are removed during successful login.

## Verification Commands

```bash
npm run lint
npm run build
npm run db:migrate:remote
npm run worker:deploy
curl -fsS https://earth-movers-api.loga.workers.dev/health
```
