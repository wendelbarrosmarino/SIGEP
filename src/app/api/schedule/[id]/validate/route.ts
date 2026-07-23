import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { scheduleEngineService } from '@/lib/services/schedule-engine.service';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const token = request.cookies.get('sigep_token')?.value;
  if (!token) return NextResponse.json({ success: false }, { status: 401 });
  const payload = authService.verifyToken(token);
  if (!payload || payload.role !== 'RT') return NextResponse.json({ success: false }, { status: 403 });

  const conflicts = await scheduleEngineService.validateSchedule(params.id);
  return NextResponse.json({ success: true, data: conflicts });
}
