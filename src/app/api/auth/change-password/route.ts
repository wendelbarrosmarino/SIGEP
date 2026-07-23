import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authService } from '@/lib/services/auth.service';

const schema = z.object({
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sigep_token')?.value;
  if (!token) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });

  const payload = authService.verifyToken(token);
  if (!payload) return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Senha não atende aos requisitos de segurança' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';

  const ok = await authService.changePassword(payload.sub, parsed.data.password, ip, ua);
  if (!ok) return NextResponse.json({ success: false, error: 'Erro ao alterar senha' }, { status: 500 });

  const response = NextResponse.json({ success: true });
  response.cookies.delete('sigep_first_access');
  return response;
}
