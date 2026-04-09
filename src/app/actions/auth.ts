'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/lib/auth';

export type SignInResult = { error: string } | undefined;

export async function signInAction(_prev: SignInResult, formData: FormData): Promise<SignInResult> {
  try {
    await signIn('credentials', {
      phone: String(formData.get('phone') || ''),
      password: String(formData.get('password') || ''),
      redirectTo: '/admin',
    });
    return undefined;
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: e.type || 'AuthError' };
    }
    // Next.js redirect throws — let it propagate
    throw e;
  }
}
