const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

// Tokens are kept in memory plus localStorage. On Android, move the refresh token
// to Capacitor secure storage before release.
const KEY = 'mt.refresh';
let accessToken: string | null = null;

export function setSession(tokens: { accessToken: string; refreshToken: string }) {
  accessToken = tokens.accessToken;
  localStorage.setItem(KEY, tokens.refreshToken);
}

export function clearSession() {
  accessToken = null;
  localStorage.removeItem(KEY);
}

export function hasSession() {
  return accessToken !== null || localStorage.getItem(KEY) !== null;
}

async function refresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem(KEY);
  if (!refreshToken) return false;
  const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    clearSession();
    return false;
  }
  setSession(await res.json());
  return true;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const run = () =>
    fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...init.headers,
      },
    });
  let res = await run();
  if (res.status === 401 && (await refresh())) res = await run();
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'request_failed');
  return res.status === 204 ? (undefined as T) : res.json();
}
