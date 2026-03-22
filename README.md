# ethprofito.com

Admin-managed trading platform starter for crypto, stocks, and gold. This project includes:

- Next.js App Router frontend
- Role-based login for users and admin operators
- Trader dashboard and admin back office
- Deposit wallet display for BTC, ETH, and SOL
- Prisma schema for users, balances, trades, deposit addresses, ledger entries, and audit logs
- Embedded TradingView widgets plus server-side market API fetchers

## Important

This codebase is a starter, not a licensed exchange, brokerage, or regulated custody stack. If you want to launch a real platform that handles customer assets, you need legal review, KYC/AML, sanctions screening, audited custody controls, security monitoring, withdrawal approval flows, and jurisdiction-specific licensing.

## Included deposit wallets

- BTC: `bc1qhywf8l6e47e5myypr3ywu7wn2thh7fldvc0gqf`
- ETH: `0x2cA2A89b0242ac1D85453F2259c821Ff37b1e3E3`
- SOL: `HWgfhJRBX5Ne7xh2PaSy2yVQxZJ1m3LzBiu1zxCUvobw`

## Setup

1. Copy `.env.example` to `.env`
2. Install dependencies:

```powershell
cmd /c npm.cmd install
```

3. Generate Prisma client:

```powershell
cmd /c npm.cmd run prisma:generate
```

4. Push the schema to PostgreSQL:

```powershell
cmd /c npm.cmd run prisma:push
```

5. Seed sample admin and trading data:

```powershell
cmd /c npm.cmd run prisma:seed
```

6. Start the app:

```powershell
cmd /c npm.cmd run dev
```

Open `http://localhost:3000`

Demo seeded credentials after `prisma:seed`:

- Admin email: `admin@ethprofito.com`
- Admin password: `AdminPass123!` unless `SEED_ADMIN_PASSWORD` is set
- Trader email: `trader@ethprofito.com`
- Trader password: `TraderPass123!` unless `SEED_TRADER_PASSWORD` is set

## Pages

- `/` public landing page
- `/markets` market overview and live chart widgets
- `/deposit` deposit wallet instructions
- `/login` user login and signup
- `/dashboard` protected per-user portfolio and funding summary
- `/admin` protected admin control room

## Database models

- `User`
- `Asset`
- `Balance`
- `Trade`
- `DepositAddress`
- `LedgerEntry`
- `AuditLog`

## Suggested next steps

- Add MFA and password reset flows
- Connect real market data providers and websocket streams
- Add deposit monitoring workers for BTC, ETH, and SOL
- Implement withdrawal reviews and risk checks
- Add KYC/AML integrations and policy enforcement
- Move from SQLite to PostgreSQL before production
- Deploy to Vercel, Railway, Render, or a VPS and connect `ethprofito.com`
