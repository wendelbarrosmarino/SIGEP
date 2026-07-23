import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authService } from '@/lib/services/auth.service';
import { auditService } from '@/lib/services/audit.service';
import { notificationService } from '@/lib/services/notification.service';
import { createAdminClient } from '@/lib/supabase/server';
import { differenceInDays, parseISO } from 'date-fns';

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(10, 'Descreva o motivo (mínimo 10 caracteres)'),
});

export async function GET(request: NextRequest) {
  const token = request.cookies.get('sigep_token')?.value;
  if (!token) return NextResponse.json({ success: false }, { status: 401 });
  const payload = authService.verifyToken(token);
  if (!payload) return NextResponse.json({ success: false }, { status: 401 });

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabase
    .from('leave_requests')
    .select(`*, user:users(id, name, crm, phone)`)
    .order('created_at', { ascending: false });

  // Funcionário vê apenas as próprias
  if (payload.role !== 'RT') {
    query = query.eq('user_id', payload.sub);
  }

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sigep_token')?.value;
  if (!token) return NextResponse.json({ success: false }, { status: 401 });
  const payload = authService.verifyToken(token);
  if (!payload) return NextResponse.json({ success: false }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Validar antecedência mínima
  const supabase = createAdminClient();
  const { data: settings } = await supabase.from('system_settings').select('min_lead_time_days').single();
  const minDays = settings?.min_lead_time_days ?? 2;

  const daysUntil = differenceInDays(parseISO(parsed.data.date), new Date());
  if (daysUntil < minDays) {
    return NextResponse.json(
      { success: false, error: `Solicitações devem ser realizadas com pelo menos ${minDays} dias de antecedência.` },
      { status: 422 }
    );
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .insert({ user_id: payload.sub, date: parsed.data.date, reason: parsed.data.reason })
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // Notificar RT
  await notificationService.notifyRTs(
    'NEW_REQUEST',
    'Nova solicitação de folga',
    `Um funcionário solicitou folga para ${parsed.data.date}.`,
    { requestId: data.id }
  );

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  await auditService.log({
    userId: payload.sub,
    action: 'REQUEST_CREATED',
    description: `Solicitação de folga criada para ${parsed.data.date}`,
    ipAddress: ip,
    userAgent: ua,
  });

  return NextResponse.json({ success: true, data }, { status: 201 });
}
