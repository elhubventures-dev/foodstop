import { randomBytes } from 'crypto';

export function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s.length > 0 ? s : 'item';
}

export function uniqueSlugCandidate(base: string): string {
  return `${base}-${randomBytes(3).toString('hex')}`;
}
