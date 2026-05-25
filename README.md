# Food Stop

Food Stop is a ChopFast multi-vendor food marketplace monorepo.

## Apps and Packages

- `apps/web` - customer ordering app built with Next.js.
- `apps/admin` - admin, merchant, and super-admin dashboard built with Next.js.
- `packages/api` - NestJS trusted API for merchant onboarding, checkout, commission, wallets, withdrawals, and disputes.
- `packages/shared` - shared browser-safe Supabase and app utilities.
- `packages/ui` - shared UI package.
- `supabase` - database migrations and edge function references.

## Prerequisites

- Node.js and npm.
- Supabase project with the migrations in `supabase/README.md` applied.
- Redis for the API queue worker.
- Paystack and messaging provider keys for payment, withdrawal, and notification flows.

## Setup

```bash
npm install
```

Create local environment files from the examples:

```bash
copy apps\web\.env.example apps\web\.env.local
copy apps\admin\.env.example apps\admin\.env.local
copy packages\api\.env.example packages\api\.env
```

Fill in the Supabase, Redis, Paystack, and internal API key values before running full checkout, merchant, wallet, or admin review flows.

## Development

```bash
npm run dev:web
npm run dev:admin
npm run dev:api
```

Default local ports:

- Web: `http://localhost:3000`
- Admin: `http://localhost:3000` unless Next chooses another port
- API: `http://localhost:4000`

Run one Next app at a time on the default port, or pass a different port from the workspace command when needed.

## Checks

```bash
npm run lint:web
npm run lint:admin
npm run test:api
```

Build scripts are also available:

```bash
npm run build:web
npm run build:admin
npm run build:api
```

## Architecture Notes

Read `docs/hybrid-architecture.md` before adding privileged flows. Browser clients should use the Supabase anon key and RLS, while payment, wallet, commission, withdrawal, and merchant approval transitions should stay in trusted server code or database RPCs.
