import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // NextAuth v5 (Auth.js) uses JWE-encrypted tokens, not signed JWTs.
  // `getToken` from next-auth/jwt expects signed JWTs → always returns null.
  // Instead, check for the session cookie's existence.
  // The actual token validation happens in server-side `auth()` calls.
  const sessionCookie =
    request.cookies.get('__Secure-authjs.session-token') ||
    request.cookies.get('authjs.session-token');

  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!login|api/auth|api/health|api/debug-auth|api/debug-signin|api/debug-cookie|_next|favicon).*)',
  ],
};
