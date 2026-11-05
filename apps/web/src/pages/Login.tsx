import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setSession } from '../lib/api';

export function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const tokens = await api<{ accessToken: string; refreshToken: string }>(
        `/api/v1/auth/${mode}`,
        {
          method: 'POST',
          body: JSON.stringify(Object.fromEntries(f)),
        },
      );
      setSession(tokens);
      nav('/');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Money Tracker</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        {mode === 'register' && (
          <input name="name" placeholder="Name" required className="rounded border p-2" />
        )}
        <input name="email" type="email" placeholder="Email" required className="rounded border p-2" />
        <input
          name="password"
          type="password"
          placeholder="Password (10+ characters)"
          minLength={10}
          required
          className="rounded border p-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="rounded bg-teal-700 p-2 font-medium text-white">
          {mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>
      <button
        className="text-sm text-teal-700 underline"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}
      </button>
    </main>
  );
}
