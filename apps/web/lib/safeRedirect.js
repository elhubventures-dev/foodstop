/** Same-site relative path only (open-redirect safe). */
export function safeRedirectPath(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!t.startsWith('/') || t.startsWith('//')) return null;
  if (t.includes('://')) return null;
  if (t.startsWith('/auth/')) return null;
  return t;
}
