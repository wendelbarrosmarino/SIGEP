import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authService } from '@/lib/services/auth.service';
import { auditService } from '@/lib/services/audit.service';
import { notificationService } from '@/lib/services/notification.service';
import { createAdminClient } from '@/lib/supabase/server';

const schema = z.object({
  status: z.enum(['APPROVED', 'DENIED']),
  comment: z.string().optional(),
}).refine((d) => d.status !== 'DENIED' || (d.comment && d.comment.length >= 10), {
  message: 'Justificativa obrigatória ao negar (mínimo 10 caracteres)',
  path: ['comment'],
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = request.cookies.get('sigep_token')?.value;
  if (!token) return NextResponse.json({ success: false }, { status: 401 });
  const payload = authService.verifyToken(token);
  if (!payload || payload.role !== 'RT') return NextResponse.json({ success: false }, { status: 403 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from('leave_requests')
    .select('*, user:users(id, name, phone)')
    .eq('id', params.id)
    .single();

  if (!existing) return NextResponse.json({ success: false, error: 'Solicitação não encontrada' }, { status: 404 });
  if (existing.status !== 'PENDING') return NextResponse.json({ success: false, error: 'Solicitação já analisada' }, { status: 409 });

  const { error } = await supabase
    .from('leave_requests')
    .update({
      status: parsed.data.status,
      rt_comment: parsed.data.comment || null,
      reviewed_by: payload.sub,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', params.id);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // Notificar funcionário
  const isApproved = parsed.data.status === 'APPROVED';
  const message = isApproved
    ? `Sua solicitação de folga para ${existing.date} foi aprovada.`
    : `Sua solicitação de folga para ${existing.date} foi negada. Motivo: ${parsed.data.comment}`;

  await notificationService.notify({
    userId: existing.user_id,
    type: isApproved ? 'REQUEST_APPROVED' : 'REQUEST_DENIED',
    title: isApproved ? 'Folga aprovada' : 'Folga negada',
    message,
    data: { requestId: params.id, date: existing.date },
  });

  // WhatsApp
  if (existing.user?.phone) {
    await notificationService.sendWhatsApp(existing.user.phone, `SIGEP: ${message}`);
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  await auditService.log({
    userId: payload.sub,
    action: isApproved ? 'REQUEST_APPROVED' : 'REQUEST_DENIED',
    description: `Folga de ${existing.date} ${isApproved ? 'aprovada' : 'negada'} para ${existing.user?.name}`,
    ipAddress: ip,
    userAgent: ua,
    metadata: { requestId: params.id, comment: parsed.data.comment },
  });

  return NextResponse.json({ success: true });
}
