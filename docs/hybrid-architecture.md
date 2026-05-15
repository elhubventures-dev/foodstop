# Food Stop — Hybrid architecture (Supabase + trusted layer)

We standardise on a **hybrid** model so product code stays simple while money,
webhooks, and privileged transitions stay correct.

## Layers

| Layer | Responsibility | Keys / access |
| ----- | -------------- | ------------- |
| **Clients** (`apps/web`, `apps/mobile`, `apps/rider`) | UX, reads, user-owned writes | **Anon key** + Supabase Auth JWT only |
| **Postgres** | Schema, constraints, **RLS**, atomic business rules | Policies enforce tenant / role boundaries |
| **Trusted compute** | Secrets, payment hooks, delayed jobs, cross-service orchestration, **merchant register** (Termii + Paystack) | **Service role** or server-only secrets — **never** ship to browsers |

“Trusted compute” can be one or more of:

1. **`SECURITY DEFINER` RPCs** in migrations (`supabase/migrations/*.sql`) — called from Edge Functions or from `@chopfast/api` with the service role.
2. **Supabase Edge Functions** (`supabase/functions/*`) — HTTP endpoints with secrets (Paystack webhooks, internal `order-delivered` hooks).
3. **`@chopfast/api` (NestJS)** (`packages/api`) — BullMQ **2-hour release** jobs, internal webhooks, dispute flows that need Redis.

Use **one** entry path per privileged flow to avoid double-processing (RPCs are idempotent where we added `UNIQUE(order_id)` on the commission ledger).

## What runs where (guidelines)

- **Menu, cart UI, listing orders for the signed-in user** → Client + RLS.
- **Mark order `delivered` (admin / rider / automation)** → Trusted path only (Edge Function, DB trigger + queue, or admin API); clients should not freely PATCH `orders.status` unless RLS is airtight.
- **Commission on delivery** → RPC `credit_merchant_for_delivered_order` (already in migrations).
- **Pending → available after hold** → RPC `release_merchant_pending_for_order`; **scheduling** the call in +2h needs a worker (`packages/api` + BullMQ today) or `pg_cron` / external scheduler later.
- **Disputes** → Insert/update `dispute_cases` via trusted path; release cancellation must stay in sync with your scheduler (see `packages/api` disputes service).

## Repository map

| Path | Role |
| ---- | ---- |
| `supabase/migrations/` | Schema, RLS (when added), RPCs |
| `supabase/functions/` | Edge Functions (optional HTTP façade over RPCs) |
| `packages/api/` | NestJS: Redis-backed release queue, internal routes |
| `packages/shared/src/supabase/` | Browser-safe anon client |
| `apps/web/lib/supabase/server.js` | Server-side Supabase in Next (still not service role in client bundles — keep service role only in server env) |

## Security checklist

- [ ] Never expose `SUPABASE_SERVICE_ROLE_KEY` or Paystack secret keys to Expo / Next client bundles.
- [ ] RLS on every user-facing table; merchant rows scoped by `merchant_id` or membership.
- [ ] Prefer `supabase.auth.getUser()` on the server for Next actions; avoid trusting client-sent `user_id` without verification.
- [ ] Internal HTTP calls protected by a shared secret (`x-internal-key` / `INTERNAL_EDGE_SECRET`).

## Next steps (incremental)

1. Apply migrations in order (see `supabase/README.md`).
2. Enable RLS policies for new multivendor tables (public read for active merchants, strict write rules).
3. Choose **one** trigger for “order delivered → commission”: Database webhook → Edge Function, or admin-only mutation → Edge Function, or `@chopfast/api` webhook.
4. Keep **one** scheduler for “release after 2h” until you replace it with `pg_cron` or managed jobs.

This doc is the default reference when adding features: **hybrid first**, not “everything in the client” and not “custom REST for every CRUD row.”
