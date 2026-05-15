import { NextResponse } from 'next/server';

/**
 * Server-side proxy: forwards to @chopfast/api with INTERNAL_API_KEY so the
 * browser never sees the secret. Configure CHOPFAST_API_URL and
 * CHOPFAST_INTERNAL_API_KEY on the admin deployment.
 */
export async function POST(req: Request) {
  const base = process.env.CHOPFAST_API_URL?.replace(/\/+$/, '');
  const key = process.env.CHOPFAST_INTERNAL_API_KEY;
  if (!base || !key) {
    return NextResponse.json(
      {
        error:
          'Server misconfiguration: set CHOPFAST_API_URL and CHOPFAST_INTERNAL_API_KEY',
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const url = `${base}/api/v1/internal/merchant-applications/notify`;
  const upstream = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': key,
    },
    body: JSON.stringify(body),
  });

  const text = await upstream.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    /* plain text */
  }

  return NextResponse.json(data, { status: upstream.status });
}
