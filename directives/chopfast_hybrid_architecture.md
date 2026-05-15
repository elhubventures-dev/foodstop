# Directive — ChopFast hybrid stack (Supabase + trusted layer)

## Goal

Ship features without maintaining a large custom REST surface. Use **Postgres + RLS**
for most data access and reserve **RPCs / Edge Functions / `packages/api`** for
secrets, payments, commission, and delayed jobs.

## Rules

1. **Browser and mobile apps** use only the **anon** Supabase key + authenticated user JWT.
2. **Service role key** appears only in: Supabase Edge Function secrets, `packages/api` env, or server-side Next routes — never in Expo or client bundles.
3. **Money movement** (commission, wallet release, refunds, Paystack) goes through:
   - SQL RPCs in `supabase/migrations/`, and/or
   - Edge Functions in `supabase/functions/`, and/or
   - `packages/api` (BullMQ release queue).
4. **Do not duplicate** privileged flows in client code; call one backend path.
5. Before adding a new REST route in Nest, ask: *can this be RLS + RPC or an Edge Function instead?*

## References

- `docs/hybrid-architecture.md` — full diagram and checklist
- `supabase/README.md` — migration order
- `chopfast-multivendor-skill/SKILL.md` — product phases

## Outputs

When implementing a feature, document which layer owns it in the PR or task notes.
