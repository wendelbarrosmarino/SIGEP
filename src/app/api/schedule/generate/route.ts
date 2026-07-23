import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authService } from '@/lib/services/auth.service';
import { auditService } from '@/lib/services/audit.service';
import { scheduleEngineService } from '@/lib/services/schedule-engine.service';

const schema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2024),
  shiftIds: z.array(z.string()).default([]),
  employeeIds: z.array(z.string()).default([]),
  respectLeaveRequests: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sigep_token')?.value;
  if (!token) return NextResponse.json({ success: false }, { status: 401 });
  const payload = authService.verifyToken(token);
  if (!payload || payload.role !== 'RT') return NextResponse.json({ success: false }, { status: 403 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 });

  try {
    const result = await scheduleEngineService.generateSchedule(parsed.data);

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';
    await auditService.log({
      userId: payload.sub,
      action: 'SCHEDULE_GENERATED',
      description: `Escala gerada: ${parsed.data.month}/${parsed.data.year}`,
      ipAddress: ip,
      userAgent: ua,
      metadata: { month: parsed.data.month, year: parsed.data.year, scheduleId: result.scheduleId },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[SCHEDULE] Generate error:', error);
    return NextResponse.json({ success: false, error: 'Erro ao gerar escala' }, { status: 500 });
  }
}
