import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('sigep_token')?.value;
  if (!token) return NextResponse.json({ success: false }, { status: 401 });

  const payload = authService.verifyToken(token);
  if (!payload) return NextResponse.json({ success: false }, { status: 401 });

  const user = await authService.getUserById(payload.sub);
  if (!user) return NextResponse.json({ success: false }, { status: 404 });

  return NextResponse.json({ success: true, data: user });
}
