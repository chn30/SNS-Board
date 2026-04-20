'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';

export async function loginAction(formData: FormData) {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirectTo: '/',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
    }
    // NextAuth redirects throw NEXT_REDIRECT which we should re-throw
    throw error;
  }
}
