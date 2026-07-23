import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { auditService } from '@/lib/services/audit.service';
import { notificationService } from '@/lib/services/notification.service';
import { createAdminClient } from '@/lib/supabase/server';
import { scheduleEngineService } from '@/lib/services/schedule-engine.service';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = request.cookies.get('sigep_token')?.value;
  if (!token) return NextResponse.json({ success: false }, { status: 401 });
  const payload = authService.verifyToken(token);
  if (!payload || payload.role !== 'RT') return NextResponse.json({ success: false }, { status: 403 });

  const supabase = createAdminClient();

  // Validar antes de publicar
  const conflicts = await scheduleEngineService.validateSchedule(params.id);
  const errors = conflicts.filter((c) => c.severity === 'ERROR');
  if (errors.length > 0) {
    return NextResponse.json({ success: false, error: 'Existem conflitos que impedem a publicação', data: conflicts }, { status: 422 });
  }

  const { data, error } = await supabase
    .from('schedules')
    .update({ is_published: true, published_at: new Date().toISOString(), published_by: payload.sub })
    .eq('id', params.id)
    .select('month, year')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // Notificar todos os funcionários
  const { data: employees } = await supabase
    .from('users')
    .select('id, phone')
    .eq('is_active', true)
    .eq('role', 'EMPLOYEE');

  if (employees) {
    await Promise.all(
      employees.map((emp) =>
        notificationService.notify({
          userId: emp.id,
          type: 'SCHEDULE_PUBLISHED',
          title: 'Nova escala disponível',
          message: `A escala de ${data.month}/${data.year} foi publicada. Acesse para ver seus plantões.`,
          data: { month: data.month, year: data.year },
        })
      )
    );
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  await auditService.log({
    userId: payload.sub,
    action: 'SCHEDULE_PUBLISHED',
    description: `Escala ${data.month}/${data.year} publicada`,
    ipAddress: ip,
    userAgent: ua,
    metadata: { scheduleId: params.id },
  });

  return NextResponse.json({ success: true });
}
