# Supabase Edge Functions

Optional **trusted HTTP layer** on top of Postgres RPCs. Use when you want:

- Webhooks (Paystack, internal “order delivered”) without running `packages/api`
- A single place to attach `Authorization` / shared-secret checks before calling `service_role` operations

Deploy with [Supabase CLI](https://supabase.com/docs/guides/functions):

```bash
supabase functions deploy order-delivered --no-verify-jwt
```

(`--no-verify-jwt` is appropriate when the caller is your backend and you authenticate with `x-internal-key` instead of a user JWT.)

## Secrets (Dashboard → Project → Edge Functions → Secrets)

| Name | Purpose |
| ---- | ------- |
| `SUPABASE_URL` | Usually injected by Supabase; confirm in dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for RPC calls that bypass RLS |
| `INTERNAL_EDGE_SECRET` | Must match the `x-internal-key` header from your trusted caller |
| `VAT_RATE` | Optional; defaults to `0.075` in code |

## Relationship to `@chopfast/api`

- **`order-delivered`** only runs `credit_merchant_for_delivered_order`. It does **not** schedule the **2-hour BullMQ release job** (that remains in `packages/api` unless you add `pg_cron` or another scheduler).
- For full parity with the Nest commission module (credit + delayed release + dispute cancellation), keep using **`packages/api`** or extend this function to call your API / a queue.
