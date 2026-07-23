import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authService } from '@/lib/services/auth.service';

const schema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';

    const result = await authService.login(parsed.data.login, parsed.data.password, ip, ua);

    if (!result) {
      return NextResponse.json({ success: false, error: 'Login ou senha incorretos' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      data: {
        user: result.user,
        isFirstAccess: result.isFirstAccess,
      },
    });

    response.cookies.set('sigep_token', result.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });

    if (result.isFirstAccess) {
      response.cookies.set('sigep_first_access', 'true', {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
