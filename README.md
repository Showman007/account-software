# Rice Mill Accounting Software

A full-stack accounting and inventory management system built for rice mill operations. Handles inbound/outbound entries, payments, expenses, milling, credit transactions, and provides a complete double-entry bookkeeping journal with audit trail.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Rails 8, Ruby, PostgreSQL |
| Frontend | React 19, TypeScript, Vite, Material-UI v7 |
| Auth | Devise + JWT |
| Authorization | Pundit |
| Containerization | Docker Compose |

## Features

- **Inbound Entries** — Track paddy purchases from suppliers (qty, rate, moisture, deductions)
- **Outbound Entries** — Track rice/by-product sales to buyers (qty, rate, transport)
- **Payments** — Record payments to suppliers and receipts from buyers
- **Payment Reversal** — Reverse payments instead of editing/deleting (audit-safe)
- **Auto Payments** — Automatically creates payment records when inbound/outbound entries include paid/received amounts
- **Expenses** — Track operational expenses by category
- **Milling Batches** — Record milling operations with costs
- **Credit Transactions** — Manage partner capital, principal returns, and profit sharing
- **Stock Management** — Track current stock levels
- **Journal Entries** — Auto-generated double-entry bookkeeping journal from all transactions
- **Reversal Audit Trail** — Edits and deletes create reversal journal entries (never overwrites)
- **Party Ledger** — Per-party transaction history with running balance
- **Master Ledger** — Overview of all buyer/supplier balances
- **Profit Calculator** — Calculate profit margins
- **Import/Export** — Excel-based data import and export
- **Dashboard** — Overview with key metrics

## Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- Git

## Quick Start

### 1. Clone the repository

```bash
git clone git@github.com:Showman007/account-software.git
cd account-software
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and set your values:

```
DB_PASSWORD=ricemill_dev_2024
JWT_SECRET=your_secret_key_here
RAILS_MASTER_KEY=your_master_key_here
```

### 3. Start the application

```bash
docker compose up --build
```

This starts three services:
- **PostgreSQL** on port `5432`
- **Rails API** on port `3000`
- **React Frontend** on port `5173`

### 4. Set up the database

```bash
docker compose exec backend rails db:create db:migrate db:seed
```

### 5. Open the app

Go to [http://localhost:5173](http://localhost:5173)

**Default admin credentials:**
| Field | Value |
|-------|-------|
| Email | `admin@ricemill.com` |
| Password | `password123` |

## Useful Commands

### Rails console

```bash
docker compose exec backend rails console
```

### Run migrations

```bash
docker compose exec backend rails db:migrate
```

### Backfill journal entries (for existing data)

```bash
docker compose exec backend rails journals:backfill
```

### Backfill auto-payments (from inbound/outbound entries)

```bash
docker compose exec backend rails payments:backfill
```

### Clear all journal entries

```bash
docker compose exec backend rails journals:clear
```

### View logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Stop the application

```bash
docker compose down
```

### Reset everything (including database)

```bash
docker compose down -v
docker compose up --build
docker compose exec backend rails db:create db:migrate db:seed
```

## API Endpoints

All API routes are under `/api/v1/`:

| Resource | Methods | Description |
|----------|---------|-------------|
| `auth/sign_in` | POST | Login |
| `auth/sign_out` | DELETE | Logout |
| `auth/me` | GET | Current user |
| `parties` | CRUD | Suppliers and buyers |
| `inbound_entries` | CRUD | Purchase entries |
| `outbound_entries` | CRUD | Sale entries |
| `payments` | GET, POST | Payments (no edit/delete) |
| `payments/:id/reverse` | POST | Reverse a payment |
| `expenses` | CRUD | Operational expenses |
| `milling_batches` | CRUD | Milling operations |
| `credit_transactions` | CRUD | Partner credit transactions |
| `partners` | CRUD | Business partners |
| `stock_items` | CRUD + recalculate | Stock levels |
| `journal_entries` | GET | Journal entries (read-only) |
| `journal_entries/backfill` | POST | Backfill journals (admin) |
| `dashboard` | GET | Dashboard metrics |
| `master_ledger` | GET | All party balances |
| `party_ledger/:id` | GET | Single party ledger |
| `profit_calculator` | GET | Profit calculations |
| `products` | CRUD | Product master data |
| `units` | CRUD | Unit master data |
| `expense_categories` | CRUD | Expense categories |
| `payment_modes` | CRUD | Payment modes |

## Project Structure

```
account-software/
├── docker-compose.yml
├── .env.example
├── backend/                  # Rails 8 API
│   ├── app/
│   │   ├── controllers/api/v1/
│   │   ├── models/
│   │   │   └── concerns/     # Journalable, AutoPayment
│   │   ├── services/         # JournalService, LedgerServices
│   │   ├── serializers/      # Blueprinter serializers
│   │   └── policies/         # Pundit authorization
│   ├── db/
│   │   ├── migrate/
│   │   └── seeds.rb
│   └── lib/tasks/            # Rake tasks
└── frontend/                 # React 19 + Vite
    └── src/
        ├── api/              # API client and resource functions
        ├── components/       # Reusable UI components
        ├── context/          # Auth context
        ├── hooks/            # Custom hooks (useCrud, useReferenceData)
        ├── pages/            # All page components
        └── types/            # TypeScript interfaces
```

## Seeded Master Data

The database seed includes ready-to-use master data for rice mill operations:

**Products:** Sona Masoori, BPT 5204, IR 64, Swarna, MTU 1010, Broken Rice, Rice Bran, Husk, and more

**Units:** Quintals, Kgs, Bags, Tonnes, Litres

**Expense Categories:** Salary, Milling Cost, Transport, Electricity, Repair & Maintenance, Labour, Packaging, Fuel

**Payment Modes:** Cash, Online Transfer, Cheque, UPI, Credit, Pending

## Accounting Concepts

### Double-Entry Journal
Every transaction (inbound, outbound, payment, expense, credit, milling) automatically generates balanced journal entries where total debits equal total credits.

### Reversal Audit Trail
When records are edited or deleted, the system creates **reversal entries** (swapping debit/credit) instead of modifying or removing the original journal entries. This provides a complete, tamper-proof audit trail.

### Payment Reversals
Payments cannot be edited or deleted. Instead, admin users can **reverse** a payment, which creates a new entry with the opposite direction. Both the original and reversal are preserved for audit purposes.
