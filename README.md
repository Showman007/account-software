# Rice Mill Accounting Software

A full-stack accounting and inventory management system built for rice mill operations. Handles inbound/outbound entries, payments, expenses, milling, credit transactions, and provides a complete double-entry bookkeeping journal with audit trail.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Rails 8, Ruby 3.3, PostgreSQL 16 |
| Frontend | React 19, TypeScript, Vite 8, Material-UI v7 |
| Auth | Devise + JWT |
| Authorization | Pundit |
| Data Fetching | TanStack React Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Containerization | Docker Compose |

## Features

- **Inbound Entries** — Track paddy purchases from suppliers (qty, rate, moisture, deductions)
- **Outbound Entries** — Track rice/by-product sales to buyers (qty, rate, transport)
- **Payments** — Record payments to suppliers and receipts from buyers
- **Payment Reversal** — Reverse payments instead of editing/deleting (audit-safe)
- **Auto Payments** — Automatically creates payment records when inbound/outbound entries include paid/received amounts
- **Bill Adjustments (FIFO Allocation)** — Automatically allocates payments to bills oldest-first, tracks per-bill payment breakdown, and deallocates on reversal
- **Expenses** — Track operational expenses by category
- **Milling Batches** — Record milling operations with costs
- **Credit Transactions** — Manage partner capital, principal returns, and profit sharing
- **Stock Management** — Track current stock levels
- **Journal Entries** — Auto-generated double-entry bookkeeping journal from all transactions
- **Reversal Audit Trail** — Edits and deletes create reversal journal entries (never overwrites)
- **Party Ledger** — Per-party transaction history with running balance and bill adjustments view
- **Master Ledger** — Overview of all buyer/supplier balances
- **Profit Calculator** — Calculate profit margins
- **Import/Export** — Excel-based data import and export
- **Dashboard** — Overview with key metrics

---

## Local Setup

You can run this project either with **Docker** (recommended, works on any OS) or **natively** on your machine.

---

### Option A: Docker Setup (Mac / Windows / Linux)

This is the simplest approach — no need to install Ruby, Node, or PostgreSQL separately.

#### Prerequisites

| Tool | Install Link |
|------|-------------|
| Docker Desktop | [docker.com/get-started](https://www.docker.com/get-started) |
| Git | [git-scm.com](https://git-scm.com/) |

> **Windows users:** Make sure WSL 2 is enabled in Docker Desktop settings.

#### Steps

```bash
# 1. Clone the repository
git clone git@github.com:Showman007/account-software.git
cd account-software

# 2. Set up environment variables
cp .env.example .env
# Edit .env if needed (defaults work for development)

# 3. Build and start all services
docker compose up --build

# 4. In a new terminal, set up the database
docker compose exec backend rails db:create db:migrate db:seed

# 5. Backfill payment allocations (if you have existing data)
docker compose exec backend rails allocations:backfill
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Option B: Native Setup — macOS

#### Prerequisites

Install these tools using [Homebrew](https://brew.sh/):

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Ruby version manager, Node.js, and PostgreSQL
brew install rbenv ruby-build node postgresql@16

# Start PostgreSQL service
brew services start postgresql@16
```

#### Ruby Setup

```bash
# Install Ruby 3.3.0
rbenv install 3.3.0
rbenv global 3.3.0

# Verify
ruby -v
# => ruby 3.3.0
```

Add to your `~/.zshrc` (or `~/.bash_profile`):
```bash
eval "$(rbenv init -)"
```

Then reload your shell:
```bash
source ~/.zshrc
```

#### PostgreSQL Setup

```bash
# Create the database user
psql postgres -c "CREATE USER ricemill WITH PASSWORD 'ricemill_dev_2024' CREATEDB;"
```

#### Backend Setup

```bash
cd account-software/backend

# Install gems
bundle install

# Create and set up the database
rails db:create db:migrate db:seed

# Backfill payment allocations
rails allocations:backfill

# Start the Rails server
rails server
# => Running on http://localhost:3000
```

#### Frontend Setup

```bash
cd account-software/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
# => Running on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Option C: Native Setup — Windows

#### Prerequisites

| Tool | Download |
|------|----------|
| Ruby 3.3 | [rubyinstaller.org](https://rubyinstaller.org/downloads/) — choose "Ruby+Devkit 3.3.x (x64)" |
| Node.js 20+ | [nodejs.org](https://nodejs.org/) — choose the LTS version |
| PostgreSQL 16 | [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) |
| Git | [git-scm.com](https://git-scm.com/download/win) |

> **Important:** During Ruby installation, check "Add Ruby to PATH" and run the MSYS2 toolchain setup when prompted. During PostgreSQL installation, remember the password you set for the `postgres` user.

#### PostgreSQL Setup

Open **pgAdmin** or a **Command Prompt** and run:

```sql
-- Using psql (add PostgreSQL bin to your PATH first)
psql -U postgres -c "CREATE USER ricemill WITH PASSWORD 'ricemill_dev_2024' CREATEDB;"
```

Or via **pgAdmin**:
1. Right-click "Login/Group Roles" → Create → Login/Group Role
2. Name: `ricemill`, Password: `ricemill_dev_2024`
3. Under "Privileges", enable "Can login?" and "Create databases?"

#### Backend Setup

Open **Command Prompt** or **PowerShell**:

```cmd
cd account-software\backend

# Install gems
bundle install

# Create and set up the database
rails db:create db:migrate db:seed

# Backfill payment allocations
rails allocations:backfill

# Start the Rails server
rails server
```

> **Troubleshooting:** If `bundle install` fails on native extensions, ensure MSYS2 was installed with Ruby. Run `ridk install` and choose option 3 (MSYS2 and MINGW development toolchain).

#### Frontend Setup

Open another **Command Prompt** or **PowerShell**:

```cmd
cd account-software\frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PASSWORD` | `ricemill_dev_2024` | PostgreSQL password |
| `DB_HOST` | `localhost` | Database host (native) or `db` (Docker) |
| `DB_USERNAME` | `ricemill` | Database username |
| `JWT_SECRET` | `super_secret_jwt_key...` | JWT signing secret (change in production) |
| `RAILS_MASTER_KEY` | — | Rails encrypted credentials key |
| `VITE_API_URL` | `http://localhost:3000/api/v1` | API URL for frontend |

The frontend `.env` file is at `frontend/.env`:
```
VITE_API_URL=http://localhost:3000/api/v1
```

---

## Default Login Credentials

| Field | Value |
|-------|-------|
| Email | `admin@ricemill.com` |
| Password | `password123` |

---

## Useful Commands

### Docker Commands

```bash
# Start all services
docker compose up --build

# Stop all services
docker compose down

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Rails console
docker compose exec backend rails console

# Run migrations
docker compose exec backend rails db:migrate

# Reset everything (wipes database)
docker compose down -v
docker compose up --build
docker compose exec backend rails db:create db:migrate db:seed
```

### Native Commands (run from `backend/` directory)

```bash
# Rails console
rails console

# Run migrations
rails db:migrate

# Reset database
rails db:drop db:create db:migrate db:seed
```

### Rake Tasks

```bash
# Backfill journal entries (for existing data)
rails journals:backfill

# Clear all journal entries
rails journals:clear

# Backfill auto-payments (from inbound/outbound paid/received fields)
rails payments:backfill

# Backfill payment allocations (FIFO allocation for all parties)
rails allocations:backfill

# Re-allocate payments for a specific party
rails allocations:reallocate_party[42]

# Clear all allocations and reset bill balances
rails allocations:reset
```

> **Docker:** Prefix all rails/rake commands with `docker compose exec backend`

---

## API Endpoints

All API routes are under `/api/v1/`:

| Resource | Methods | Description |
|----------|---------|-------------|
| `auth/sign_in` | POST | Login |
| `auth/sign_out` | DELETE | Logout |
| `auth/me` | GET | Current user |
| `auth/register` | POST | Register new user |
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
| `query_runner` | POST | Execute SQL queries (admin) |
| `query_runner/tables` | GET | List database tables (admin) |
| `dashboard` | GET | Dashboard metrics |
| `master_ledger` | GET | All party balances |
| `party_ledger/:id` | GET | Single party ledger with bill adjustments |
| `profit_calculator` | GET | Profit calculations |
| `imports` | POST | Import data from Excel |
| `exports/:id` | GET | Export data |
| `products` | CRUD | Product master data |
| `units` | CRUD | Unit master data |
| `expense_categories` | CRUD | Expense categories |
| `payment_modes` | CRUD | Payment modes |
| `users` | CRUD | User management (admin) |

---

## Project Structure

```
account-software/
├── docker-compose.yml
├── .env.example
├── backend/                     # Rails 8 API
│   ├── app/
│   │   ├── controllers/api/v1/  # API controllers
│   │   ├── models/
│   │   │   └── concerns/        # Journalable, AutoPayment
│   │   ├── services/            # PaymentAllocationService, JournalService, LedgerServices
│   │   ├── serializers/         # Blueprinter serializers
│   │   └── policies/            # Pundit authorization
│   ├── db/
│   │   ├── migrate/
│   │   └── seeds.rb
│   └── lib/tasks/               # Rake tasks (journals, payments, allocations)
└── frontend/                    # React 19 + Vite
    └── src/
        ├── api/                 # API client and resource functions
        ├── components/          # Reusable UI components (DataTable, FormDialog)
        ├── context/             # Auth context
        ├── hooks/               # Custom hooks (useCrud, useReferenceData)
        ├── pages/               # All page components
        ├── theme/               # MUI theme configuration
        └── types/               # TypeScript interfaces
```

---

## Seeded Master Data

The database seed includes ready-to-use master data for rice mill operations:

**Products:** Sona Masoori, BPT 5204, IR 64, Swarna, MTU 1010, Broken Rice, Rice Bran, Husk, and more

**Units:** Quintals, Kgs, Bags, Nos, Tonnes, Litres

**Expense Categories:** Salary, Milling Cost, Transport, Electricity, Repair & Maintenance, Labour, Packaging, Fuel

**Payment Modes:** Cash, Online Transfer, Cheque, UPI, Credit, Pending

---

## Accounting Concepts

### Double-Entry Journal
Every transaction (inbound, outbound, payment, expense, credit, milling) automatically generates balanced journal entries where total debits equal total credits.

### Reversal Audit Trail
When records are edited or deleted, the system creates **reversal entries** (swapping debit/credit) instead of modifying or removing the original journal entries. This provides a complete, tamper-proof audit trail.

### Payment Reversals
Payments cannot be edited or deleted. Instead, admin users can **reverse** a payment, which creates a new entry with the opposite direction. Both the original and reversal are preserved for audit purposes.

### Bill Adjustments (FIFO Payment Allocation)
When a payment is recorded, it is automatically allocated to the party's outstanding bills in FIFO order (oldest bill first):

- **Buyer makes a payment** → allocated against their oldest unpaid outbound (sale) bills
- **Supplier is paid** → allocated against the oldest unpaid inbound (purchase) bills
- **Payment reversal** → all allocations for that payment are removed and bill balances are restored

Each bill tracks its total amount, how much has been allocated from payments, and the remaining balance. The "Bill Adjustments" tab in the Party Ledger shows a per-bill breakdown with payment details and progress indicators.

**Example:** A buyer has two bills — Bill A (Rs 50,000) and Bill B (Rs 30,000). If they pay Rs 60,000:
1. Bill A is fully cleared (Rs 50,000 allocated, balance Rs 0)
2. Bill B is partially paid (Rs 10,000 allocated, balance Rs 20,000)

---

## Deployment to Railway

This project is pre-configured for [Railway](https://railway.app/) deployment with automatic database backups.

### Step 1: Create a Railway Account

1. Go to [railway.app](https://railway.app/) and sign up (GitHub login recommended)
2. Install the Railway CLI:

**Mac:**
```bash
brew install railway
```

**Windows (PowerShell):**
```powershell
iwr https://raw.githubusercontent.com/railwayapp/cli/master/install.ps1 -useb | iex
```

3. Login:
```bash
railway login
```

### Step 2: Create a New Project

```bash
cd account-software
railway init
```

Choose "Empty Project" when prompted.

### Step 3: Add PostgreSQL

```bash
railway add --plugin postgresql
```

This creates a managed PostgreSQL instance with **automatic daily backups** and one-click restore.

### Step 4: Deploy the Backend

```bash
# Link to the backend service
cd backend
railway link

# Set environment variables
railway variables set RAILS_ENV=production
railway variables set SECRET_KEY_BASE=$(openssl rand -hex 64)
railway variables set DEVISE_JWT_SECRET_KEY=$(openssl rand -hex 32)
railway variables set RAILS_MASTER_KEY=<your-master-key>

# Deploy
railway up
```

> **Note:** `DATABASE_URL` is automatically set by Railway when PostgreSQL is linked.

After deploy, Railway gives you a URL like `https://backend-production-xxxx.railway.app`. Copy this — you'll need it for the frontend.

### Step 5: Deploy the Frontend

```bash
cd ../frontend
railway link   # Select "Create new service"

# Set the API URL (use your backend Railway URL from Step 4)
railway variables set VITE_API_URL=https://backend-production-xxxx.railway.app/api/v1

# Deploy
railway up
```

### Step 6: Link Frontend URL to Backend CORS

After the frontend deploys, copy its Railway URL and set it on the backend:

```bash
cd ../backend
railway variables set FRONTEND_URL=https://frontend-production-xxxx.railway.app
```

Redeploy the backend to pick up the CORS change:
```bash
railway up
```

### Step 7: Seed the Database

```bash
cd backend
railway run rails db:seed
railway run rails allocations:backfill
```

### Step 8: Open Your App

```bash
cd ../frontend
railway open
```

### Railway Environment Variables Reference

| Variable | Where to Set | Value |
|----------|-------------|-------|
| `DATABASE_URL` | Backend (auto) | Set automatically by PostgreSQL addon |
| `RAILS_ENV` | Backend | `production` |
| `SECRET_KEY_BASE` | Backend | `openssl rand -hex 64` |
| `DEVISE_JWT_SECRET_KEY` | Backend | `openssl rand -hex 32` |
| `RAILS_MASTER_KEY` | Backend | Your master key from `backend/config/master.key` |
| `FRONTEND_URL` | Backend | Your frontend Railway URL |
| `VITE_API_URL` | Frontend | Your backend Railway URL + `/api/v1` |

### Railway Database Backups

Railway PostgreSQL includes:
- **Automatic daily backups** (7-day retention)
- **Point-in-time recovery**
- One-click restore from the Railway dashboard under your PostgreSQL service → **Backups** tab

To manually backup:
```bash
# Export a backup locally
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from a local backup
railway run psql $DATABASE_URL < backup_20260326.sql
```

### Custom Domain (Optional)

In the Railway dashboard:
1. Click your frontend service → **Settings** → **Networking**
2. Click **Generate Domain** or add a **Custom Domain**
3. For custom domains, add the CNAME record Railway provides to your DNS

Update the backend `FRONTEND_URL` variable to match your custom domain.

### Railway Cost Estimate

| Service | Estimated Monthly |
|---------|------------------|
| Backend (Rails) | ~₹200–400 |
| Frontend (nginx) | ~₹50–100 |
| PostgreSQL (1 GB) | ~₹150–300 |
| **Total** | **~₹400–800** |

Railway bills based on usage. The hobby plan ($5/month credit) covers most small apps.
