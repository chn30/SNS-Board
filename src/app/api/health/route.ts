import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      userCount,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasUrl: !!process.env.NEXTAUTH_URL,
        nextauthUrl: process.env.NEXTAUTH_URL,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        status: 'error',
        db: 'failed',
        error: e.message,
        env: {
          hasDbUrl: !!process.env.DATABASE_URL,
          hasSecret: !!process.env.NEXTAUTH_SECRET,
          hasUrl: !!process.env.NEXTAUTH_URL,
        },
      },
      { status: 500 },
    );
  }
}
