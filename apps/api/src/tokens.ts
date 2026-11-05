import { createHash, randomBytes } from 'node:crypto';

export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function newRefreshToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
