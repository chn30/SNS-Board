import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token = await getToken({
    req: request,
    secret,
  });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!login|api/auth|api/health|api/debug-auth|api/debug-signin|_next|favicon).*)',
  ],
};
