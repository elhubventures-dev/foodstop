import { NextResponse } from 'next/server';
import { assertStaffOrAdmin } from '../../assert-staff';

type Body = { ids?: string[]; limit?: number; delayMs?: number };

/**
 * Staff-only proxy: triggers @chopfast/api internal batch Paystack transfers
 * for admin-approved pending withdrawals (skips merchant OTP).
 * Requires CHOPFAST_API_URL + CHOPFAST_INTERNAL_API_KEY on the admin server.
 */
export async function POST(req: Request) {
  const auth = await assertStaffOrAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const base = process.env.CHOPFAST_API_URL?.replace(/\/+$/, '');
  const key = process.env.CHOPFAST_INTERNAL_API_KEY;
  if (!base || !key) {
    return NextResponse.json(
      {
        error:
          'Server misconfiguration: set CHOPFAST_API_URL and CHOPFAST_INTERNAL_API_KEY for batch payouts.',
      },
      { status: 503 },
    );
  }

  let body: Body = {};
  try {
    const raw = (await req.json()) as unknown;
    if (raw && typeof raw === 'object') {
      body = raw as Body;
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const url = `${base}/api/v1/internal/withdrawals/batch-process`;
  const upstream = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': key,
    },
    body: JSON.stringify({
      ids: Array.isArray(body.ids) ? body.ids : undefined,
      limit: typeof body.limit === 'number' ? body.limit : undefined,
      delayMs: typeof body.delayMs === 'number' ? body.delayMs : undefined,
    }),
  });

  const text = await upstream.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    /* plain */
  }

  return NextResponse.json(data, { status: upstream.status });
}
