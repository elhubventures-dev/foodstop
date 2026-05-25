# Deployment Checklist

## Required Services

- Customer web app: deploy `apps/web`.
- Admin app: deploy `apps/admin`.
- Trusted API: deploy `packages/api` with Redis access.
- Supabase: apply all migrations in `supabase/migrations` in filename order.
- Redis: required by `packages/api` for wallet release jobs and OTP state.

## Supabase Migrations

Before production traffic, apply the latest migrations, especially:

- `20260504170000_sensitive_marketplace_rls.sql`
- `20260504180000_financial_rpc_hardening.sql`

The local Supabase CLI could not push from this machine because the project is not linked and no `SUPABASE_ACCESS_TOKEN` is configured. Use one of:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

or provide a valid direct/pooler Postgres database URL and run:

```bash
supabase db push --db-url "<database-url>"
```

## Web App Environment

Set these for `apps/web`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CHOPFAST_API_URL`
- SMTP values used by order emails, if email is enabled

## Admin App Environment

Set these for `apps/admin`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CHOPFAST_API_URL`
- `CHOPFAST_INTERNAL_API_KEY`
- `NEXT_PUBLIC_CHOPFAST_API_URL`

## API Environment

Set these for `packages/api`:

- `PORT`
- `NODE_ENV`
- `INTERNAL_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL`
- `PAYSTACK_SECRET_KEY`
- `MERCHANT_JWT_SECRET`
- `RESEND_*`, `SENDGRID_*`, and `TERMII_*` values as needed
- `CUSTOMER_WEB_BASE_URL`
- `MERCHANT_PORTAL_BASE_URL`
- `WITHDRAWAL_MIN_NGN`
- `WITHDRAWAL_ADMIN_THRESHOLD_NGN`

Use strong non-default secrets for `INTERNAL_API_KEY` and `MERCHANT_JWT_SECRET`.

## Paystack Webhooks

Configure Paystack charge events to the customer web app:

```text
https://<web-domain>/api/webhooks/paystack
```

Configure Paystack transfer events to the trusted API:

```text
https://<api-domain>/api/v1/webhooks/paystack
```

Ensure both use the same `PAYSTACK_SECRET_KEY` as the corresponding deployed service.

## Pre-Launch Checks

Run:

```bash
npm audit --omit=dev
npm run lint:web
npm run lint:admin
npm run test:api
npm run build:web
npm run build:admin
npm run build:api
```

Then perform one Paystack test-mode checkout and one test-mode merchant withdrawal before enabling live keys.
