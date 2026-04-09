'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signInAction, type SignInResult } from '@/app/actions/auth';

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState<SignInResult, FormData>(
    signInAction,
    undefined,
  );

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl shadow-xl border border-teal-900/10 p-8 sm:p-10">
        <Link href="/" className="block mb-8">
          <p className="font-display text-3xl text-teal-900 leading-tight">
            Maybe<span className="text-ochre-500">Tomorrow</span>
            <span className="text-teal-700">.store</span>
          </p>
          <p className="text-[11px] tracking-widest uppercase text-ochre-600 mt-1">
            Admin sign-in
          </p>
        </Link>

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-teal-900 mb-1.5"
            >
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="username"
              placeholder="+254700000001"
              className="w-full rounded-xl border border-teal-900/15 bg-sand-50/60 px-4 py-3 text-teal-900 placeholder:text-teal-900/30 focus:outline-none focus:ring-2 focus:ring-ochre-500/60 focus:border-ochre-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-teal-900 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-teal-900/15 bg-sand-50/60 px-4 py-3 text-teal-900 placeholder:text-teal-900/30 focus:outline-none focus:ring-2 focus:ring-ochre-500/60 focus:border-ochre-500"
            />
          </div>

          {state?.error && (
            <div className="rounded-xl bg-terracotta-500/10 border border-terracotta-500/30 px-4 py-3 text-sm text-terracotta-600">
              {state.error === 'CredentialsSignin'
                ? 'Invalid phone or password.'
                : `Sign-in failed: ${state.error}`}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-teal-900 px-4 py-3.5 text-sand-50 font-medium hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-xs text-teal-900/50 bg-sand-100 rounded-lg px-3 py-2 border border-teal-900/5">
          <span className="font-semibold text-teal-900/70">Demo:</span>{' '}
          <code className="font-mono">+254700000001</code> /{' '}
          <code className="font-mono">mt2026demo</code>
        </p>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-teal-900/50 hover:text-ochre-600 transition"
          >
            ← Back to landing
          </Link>
        </div>
      </div>
    </div>
  );
}
