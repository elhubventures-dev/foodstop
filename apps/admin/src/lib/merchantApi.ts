/**
 * Calls @chopfast/api merchant routes (Bearer MERCHANT_JWT).
 * Base URL: NEXT_PUBLIC_CHOPFAST_API_URL (default http://localhost:4000).
 */

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_CHOPFAST_API_URL ?? 'http://localhost:4000'
  ).replace(/\/$/, '');
}

function parseErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const m = (data as { message?: unknown }).message;
  if (typeof m === 'string') return m;
  if (Array.isArray(m)) return m.join(', ');
  return fallback;
}

async function merchantApiFetch<T>(
  method: string,
  path: string,
  token: string,
  body?: unknown,
): Promise<T> {
  const url = `${apiBase()}/api/v1${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (method !== 'GET' && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, {
    method,
    headers,
    body:
      body !== undefined && method !== 'GET'
        ? JSON.stringify(body)
        : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    throw new Error(parseErrorMessage(data, res.statusText || 'Request failed'));
  }
  return data as T;
}

export async function merchantApiGet<T>(
  path: string,
  token: string,
): Promise<T> {
  return merchantApiFetch<T>('GET', path, token);
}

/** Plain text (e.g. CSV template). */
/** HTML (e.g. invoice print view). */
export async function merchantApiGetHtml(
  path: string,
  token: string,
): Promise<string> {
  return merchantApiGetText(path, token);
}

export async function merchantApiGetText(
  path: string,
  token: string,
): Promise<string> {
  const url = `${apiBase()}/api/v1${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = res.statusText || 'Request failed';
    try {
      const j = JSON.parse(text) as { message?: unknown };
      msg = parseErrorMessage(j, msg);
    } catch {
      /* use status */
    }
    throw new Error(msg);
  }
  return text;
}

export async function merchantApiPost<T>(
  path: string,
  token: string,
  body?: unknown,
): Promise<T> {
  return merchantApiFetch<T>('POST', path, token, body);
}

export async function merchantApiPatch<T>(
  path: string,
  token: string,
  body: unknown,
): Promise<T> {
  return merchantApiFetch<T>('PATCH', path, token, body);
}

export async function merchantApiPut<T>(
  path: string,
  token: string,
  body: unknown,
): Promise<T> {
  return merchantApiFetch<T>('PUT', path, token, body);
}

export async function merchantApiDelete<T>(
  path: string,
  token: string,
): Promise<T> {
  return merchantApiFetch<T>('DELETE', path, token);
}
