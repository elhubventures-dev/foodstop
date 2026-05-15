/**
 * Nigerian mobile validation + normalisation for Termii (234XXXXXXXXXX, no +).
 */

export function normalizeNigerianPhoneTo234(phone: string): string {
  let t = phone.trim().replace(/\s+/g, '');
  if (t.startsWith('+')) {
    t = t.slice(1);
  }
  if (t.startsWith('234') && t.length === 13) {
    return t;
  }
  if (t.startsWith('0') && t.length === 11) {
    return `234${t.slice(1)}`;
  }
  if (/^[789][01]\d{8}$/.test(t) && t.length === 10) {
    return `234${t}`;
  }
  throw new Error('Invalid Nigerian phone number');
}

export function isValidNigerianMobile(phone: string): boolean {
  try {
    const n = normalizeNigerianPhoneTo234(phone);
    return /^234[789][01]\d{8}$/.test(n);
  } catch {
    return false;
  }
}
