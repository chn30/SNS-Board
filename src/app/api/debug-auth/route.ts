import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({
        step: 'findUser',
        result: 'NOT_FOUND',
        email,
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    return NextResponse.json({
      step: 'complete',
      userFound: true,
      passwordValid: valid,
      userId: user.id,
      role: user.role,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
