import { redirect } from 'next/navigation';
import { auth } from './auth';

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;
  return {
    id: session.user.id,
    role: (session.user as any).role as string,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'ADMIN') redirect('/');
  return user;
}
