import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const cookies = request.cookies
    .getAll()
    .map((c) => ({ name: c.name, valueLength: c.value.length }));

  let tokenDefault = null;
  let tokenSecure = null;
  let tokenAuthjs = null;
  let errors: string[] = [];

  try {
    tokenDefault = await getToken({ req: request, secret });
  } catch (e: any) {
    errors.push(`default: ${e.message}`);
  }

  try {
    tokenSecure = await getToken({
      req: request,
      secret,
      cookieName: '__Secure-authjs.session-token',
    });
  } catch (e: any) {
    errors.push(`secure: ${e.message}`);
  }

  try {
    tokenAuthjs = await getToken({
      req: request,
      secret,
      cookieName: 'authjs.session-token',
    });
  } catch (e: any) {
    errors.push(`authjs: ${e.message}`);
  }

  return NextResponse.json({
    cookies,
    secret: secret ? `${secret.substring(0, 5)}...` : 'MISSING',
    tokenDefault: tokenDefault ? 'FOUND' : null,
    tokenSecure: tokenSecure ? 'FOUND' : null,
    tokenAuthjs: tokenAuthjs ? 'FOUND' : null,
    errors,
  });
}
