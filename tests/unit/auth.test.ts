import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

// Mock next-auth — we need to intercept the NextAuth() call to extract config
let capturedConfig: any = null;
vi.mock('next-auth', () => {
  return {
    default: (config: any) => {
      capturedConfig = config;
      return {
        handlers: {},
        signIn: vi.fn(),
        signOut: vi.fn(),
        auth: vi.fn(),
      };
    },
  };
});

// Mock next-auth/providers/credentials
vi.mock('next-auth/providers/credentials', () => ({
  default: (opts: any) => opts,
}));

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`REDIRECT:${url}`);
  },
}));

// Import modules after mocks
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Force auth.ts to be imported and executed so capturedConfig is populated
beforeEach(async () => {
  vi.clearAllMocks();
  // Re-import to ensure config is captured
  if (!capturedConfig) {
    await import('@/lib/auth');
  }
});

describe('authorize() behavior', () => {
  function getAuthorize() {
    return capturedConfig.providers[0].authorize;
  }

  it('returns user with id and role for valid credentials', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      password: 'hashed-pw',
      role: 'USER',
    });
    (bcrypt.compare as any).mockResolvedValue(true);

    const result = await getAuthorize()({
      email: 'test@test.com',
      password: 'secret',
    });

    expect(result).toEqual({ id: 'user-1', role: 'USER' });
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('ssoId');
  });

  it('returns null for wrong password', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      password: 'hashed-pw',
      role: 'USER',
    });
    (bcrypt.compare as any).mockResolvedValue(false);

    const result = await getAuthorize()({
      email: 'test@test.com',
      password: 'wrong',
    });
    expect(result).toBeNull();
  });

  it('returns null for unknown email', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const result = await getAuthorize()({
      email: 'noone@test.com',
      password: 'secret',
    });
    expect(result).toBeNull();
  });

  it('returns null when email or password is missing', async () => {
    const authorize = getAuthorize();
    expect(await authorize({ email: '', password: 'x' })).toBeNull();
    expect(await authorize({ email: 'x', password: '' })).toBeNull();
  });
});

describe('JWT callback', () => {
  it('populates token with userId and role from user, without email or ssoId', () => {
    const jwt = capturedConfig.callbacks.jwt;
    const token = jwt({ token: {}, user: { id: 'u1', role: 'ADMIN' } });

    expect(token.userId).toBe('u1');
    expect(token.role).toBe('ADMIN');
    expect(token).not.toHaveProperty('email');
    expect(token).not.toHaveProperty('ssoId');
  });

  it('returns token unchanged when no user (subsequent calls)', () => {
    const jwt = capturedConfig.callbacks.jwt;
    const token = jwt({
      token: { userId: 'u1', role: 'USER' },
      user: undefined,
    });

    expect(token.userId).toBe('u1');
    expect(token.role).toBe('USER');
  });
});

describe('Session callback', () => {
  it('populates session.user.id and session.user.role from token', () => {
    const sessionCb = capturedConfig.callbacks.session;
    const session = { user: { id: '', name: '' } as any };
    const result = sessionCb({
      session,
      token: { userId: 'u1', role: 'ADMIN' },
    });

    expect(result.user.id).toBe('u1');
    expect(result.user.role).toBe('ADMIN');
  });
});

describe('Authorized callback (middleware protection)', () => {
  it('returns true when user is authenticated', () => {
    const authorized = capturedConfig.callbacks.authorized;
    expect(authorized({ auth: { user: { id: 'u1' } } })).toBe(true);
  });

  it('returns false when auth is null (unauthenticated)', () => {
    const authorized = capturedConfig.callbacks.authorized;
    expect(authorized({ auth: null })).toBe(false);
  });

  it('returns false when auth.user is missing', () => {
    const authorized = capturedConfig.callbacks.authorized;
    expect(authorized({ auth: {} })).toBe(false);
  });
});

describe('Auth utilities - requireAuth', () => {
  it('redirects to /login when no session', async () => {
    // We need to mock auth() for auth-utils
    const { auth } = await import('@/lib/auth');
    (auth as any).mockResolvedValue(null);

    const { requireAuth } = await import('@/lib/auth-utils');

    await expect(requireAuth()).rejects.toThrow('REDIRECT:/login');
    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('returns user when session exists', async () => {
    const { auth } = await import('@/lib/auth');
    (auth as any).mockResolvedValue({ user: { id: 'u1', role: 'USER' } });

    const { requireAuth } = await import('@/lib/auth-utils');
    const user = await requireAuth();

    expect(user).toEqual({ id: 'u1', role: 'USER' });
  });
});

describe('Auth utilities - requireAdmin', () => {
  it('redirects non-admin users to /', async () => {
    const { auth } = await import('@/lib/auth');
    (auth as any).mockResolvedValue({ user: { id: 'u1', role: 'USER' } });

    const { requireAdmin } = await import('@/lib/auth-utils');

    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/');
    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('returns user for admin role', async () => {
    const { auth } = await import('@/lib/auth');
    (auth as any).mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } });

    const { requireAdmin } = await import('@/lib/auth-utils');
    const user = await requireAdmin();

    expect(user).toEqual({ id: 'u1', role: 'ADMIN' });
  });
});
