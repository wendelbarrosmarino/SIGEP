import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { auditService } from '@/lib/services/audit.service';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sigep_token')?.value;

  if (token) {
    const payload = authService.verifyToken(token);
    if (payload) {
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      const ua = request.headers.get('user-agent') || 'unknown';
      await auditService.log({
        userId: payload.sub,
        action: 'LOGOUT',
        description: 'Logout realizado',
        ipAddress: ip,
        userAgent: ua,
      });
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete('sigep_token');
  response.cookies.delete('sigep_first_access');
  return response;
}
