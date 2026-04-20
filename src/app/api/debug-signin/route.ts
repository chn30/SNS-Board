import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  try {
    // 1. Get CSRF token
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfRes.json();

    // 2. Attempt sign in
    const signInRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        csrfToken: csrfData.csrfToken,
        email: 'test-user-1@test.com',
        password: 'password',
      }),
      redirect: 'manual',
    });

    const setCookie = signInRes.headers.get('set-cookie');

    return NextResponse.json({
      csrfToken: csrfData.csrfToken,
      signInStatus: signInRes.status,
      signInLocation: signInRes.headers.get('location'),
      hasCookie: !!setCookie,
      cookiePreview: setCookie?.substring(0, 100),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
