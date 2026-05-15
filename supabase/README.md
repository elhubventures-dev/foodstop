# Supabase (Food Stop)

SQL migrations in this folder define the **database contract** for the hybrid stack:
clients talk to Postgres through Supabase; privileged logic lives in **RPCs**, **Edge Functions**, and optionally **`packages/api`**.

## Apply migrations (order matters)

1. `apps/web/setup_database.sql` — base ChopFast schema (if starting fresh or aligning a new project).
2. `migrations/20260504000000_chopfast_multivendor_marketplace.sql` — merchants, wallets, tenant columns, anchor seed.
3. `migrations/20260504000100_commission_engine_rpc.sql` — commission / release / clawback RPCs.
4. `migrations/20260504000200_merchant_registration_fields.sql` — merchant onboarding / profile `merchant` role (if used).
5. `migrations/20260504000300_withdrawal_wallet_rpc.sql` — wallet debit + restore for Paystack withdrawals.

In hosted Supabase: **SQL Editor** → paste each file in order, or use [Supabase CLI](https://supabase.com/docs/guides/cli) `db push` after linking the project.

## Edge Functions

See `functions/README.md`. Functions use **server secrets** only (set in Supabase Dashboard → Edge Functions → Secrets).

## Related docs

- [Hybrid architecture](../docs/hybrid-architecture.md) — when to use client vs RPC vs API.
