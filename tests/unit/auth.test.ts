import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function readSrc(path: string): string {
  return readFileSync(resolve(__dirname, '../../src', path), 'utf-8');
}

describe('Auth configuration', () => {
  it('auth.ts exports auth, signIn, signOut, and handlers', () => {
    const src = readSrc('lib/auth.ts');
    expect(src).toContain('export const { handlers, signIn, signOut, auth }');
  });

  it('auth.ts uses JWT strategy with userId and role only (no email, no ssoId)', () => {
    const src = readSrc('lib/auth.ts');
    expect(src).toContain("strategy: 'jwt'");
    expect(src).toContain('token.userId = user.id');
    expect(src).toContain('token.role');
    // Iron Law: no email or ssoId in token
    expect(src).not.toMatch(/token\.email\s*=/);
    expect(src).not.toMatch(/token\.ssoId\s*=/);
  });

  it('auth.ts authorize validates credentials with bcrypt and returns only id+role', () => {
    const src = readSrc('lib/auth.ts');
    expect(src).toContain('bcrypt.compare');
    expect(src).toContain('prisma.user.findUnique');
    // Return object should have id and role only
    expect(src).toContain('return { id: user.id, role: user.role }');
  });

  it('auth.ts configures /login as custom sign-in page', () => {
    const src = readSrc('lib/auth.ts');
    expect(src).toContain("signIn: '/login'");
  });

  it('session callback populates session.user.id and session.user.role', () => {
    const src = readSrc('lib/auth.ts');
    expect(src).toContain('session.user.id = token.userId');
    expect(src).toContain('role = token.role');
  });
});

describe('Auth route handler', () => {
  it('API route re-exports GET and POST from auth handlers', () => {
    const src = readSrc('app/api/auth/[...nextauth]/route.ts');
    expect(src).toContain("import { handlers } from '@/lib/auth'");
    expect(src).toContain('export const { GET, POST } = handlers');
  });
});

describe('Type augmentation', () => {
  it('next-auth.d.ts augments User with role and JWT with userId+role', () => {
    const src = readSrc('types/next-auth.d.ts');
    expect(src).toContain('role');
    expect(src).toContain('userId');
    expect(src).toContain("declare module 'next-auth'");
    expect(src).toContain("declare module 'next-auth/jwt'");
  });
});

describe('Middleware', () => {
  it('middleware.ts exports auth as middleware with correct matcher', () => {
    const src = readSrc('middleware.ts');
    expect(src).toContain("export { auth as middleware } from '@/lib/auth'");
    expect(src).toContain('login|api/auth|_next|favicon');
  });

  it('matcher pattern excludes login, api/auth, _next, and favicon', () => {
    const src = readSrc('middleware.ts');
    const matcherMatch = src.match(/matcher:\s*\[([^\]]*)\]/);
    expect(matcherMatch).not.toBeNull();
    const matcher = matcherMatch![1];
    expect(matcher).toContain('login');
    expect(matcher).toContain('api/auth');
    expect(matcher).toContain('_next');
    expect(matcher).toContain('favicon');
  });
});

describe('Auth utilities', () => {
  it('auth-utils.ts exports getCurrentUser, requireAuth, requireAdmin', () => {
    const src = readSrc('lib/auth-utils.ts');
    expect(src).toContain('export async function getCurrentUser');
    expect(src).toContain('export async function requireAuth');
    expect(src).toContain('export async function requireAdmin');
  });

  it('requireAuth redirects to /login when no session', () => {
    const src = readSrc('lib/auth-utils.ts');
    expect(src).toContain("redirect('/login')");
  });

  it('requireAdmin checks for ADMIN role and redirects non-admins', () => {
    const src = readSrc('lib/auth-utils.ts');
    expect(src).toContain("'ADMIN'");
    expect(src).toContain("redirect('/')");
  });
});

describe('Login page', () => {
  it('login page uses signIn from next-auth/react with credentials provider', () => {
    const src = readSrc('app/(auth)/login/page.tsx');
    expect(src).toContain("signIn('credentials'");
    expect(src).toContain("'use client'");
  });

  it('login page has email and password inputs with test IDs', () => {
    const src = readSrc('app/(auth)/login/page.tsx');
    expect(src).toContain('data-testid="login-email"');
    expect(src).toContain('data-testid="login-password"');
    expect(src).toContain('data-testid="login-submit"');
  });

  it('login page displays error message for invalid credentials', () => {
    const src = readSrc('app/(auth)/login/page.tsx');
    expect(src).toContain('data-testid="login-error"');
    expect(src).toContain('setError');
  });

  it('login page redirects to / on successful login', () => {
    const src = readSrc('app/(auth)/login/page.tsx');
    expect(src).toContain("redirectTo: '/'");
  });
});
