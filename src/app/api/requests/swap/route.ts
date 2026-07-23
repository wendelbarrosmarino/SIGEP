import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authService } from '@/lib/services/auth.service';
import { auditService } from '@/lib/services/audit.service';
import { notificationService } from '@/lib/services/notification.service';
import { createAdminClient } from '@/lib/supabase/server';
import { differenceInDays, parseISO } from 'date-fns';

const schema = z.object({
  requesterEntryId: z.string().uuid(),
  targetId: z.string().uuid(),
  targetEntryId: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  const token = request.cookies.get('sigep_token')?.value;
  if (!token) return NextResponse.json({ success: false }, { status: 401 });
  const payload = authService.verifyToken(token);
  if (!payload) return NextResponse.json({ success: false }, { status: 401 });

  const supabase = createAdminClient();

  let query = supabase
    .from('swap_requests')
    .select(`
      *,
      requester:users!requester_id(id, name, crm, phone),
      target:users!target_id(id, name, crm, phone),
      requesterEntry:schedule_entries!requester_entry_id(date, shift:shifts(name, code)),
      targetEntry:schedule_entries!target_entry_id(date, shift:shifts(name, code))
    `)
    .order('created_at', { ascending: false });

  if (payload.role !== 'RT') {
    query = query.or(`requester_id.eq.${payload.sub},target_id.eq.${payload.sub}`);
  }

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
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 });

  const supabase = createAdminClient();

  // Buscar a entrada do solicitante para verificar antecedência
  const { data: entry } = await supabase
    .from('schedule_entries')
    .select('date')
    .eq('id', parsed.data.requesterEntryId)
    .single();

  if (!entry) return NextResponse.json({ success: false, error: 'Plantão não encontrado' }, { status: 404 });

  const { data: settings } = await supabase.from('system_settings').select('min_swap_lead_time_days').single();
  const minDays = settings?.min_swap_lead_time_days ?? 2;

  const daysUntil = differenceInDays(parseISO(entry.date), new Date());
  if (daysUntil < minDays) {
    return NextResponse.json(
      { success: false, error: `Trocas de plantão somente podem ser solicitadas com pelo menos ${minDays} dias de antecedência.` },
      { status: 422 }
    );
  }

  const { data, error } = await supabase
    .from('swap_requests')
    .insert({
      requester_id: payload.sub,
      target_id: parsed.data.targetId,
      requester_entry_id: parsed.data.requesterEntryId,
      target_entry_id: parsed.data.targetEntryId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // Notificar o funcionário alvo
  await notificationService.notify({
    userId: parsed.data.targetId,
    type: 'NEW_SWAP',
    title: 'Solicitação de troca',
    message: 'Você recebeu uma solicitação de troca de plantão. Acesse o sistema para aceitar ou recusar.',
    data: { swapId: data.id },
  });

  // Notificar RT
  await notificationService.notifyRTs(
    'NEW_SWAP',
    'Nova solicitação de troca',
    'Uma nova solicitação de troca de plantão foi criada.',
    { swapId: data.id }
  );

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  await auditService.log({
    userId: payload.sub,
    action: 'SWAP_CREATED',
    description: `Solicitação de troca criada para ${entry.date}`,
    ipAddress: ip,
    userAgent: ua,
  });

  return NextResponse.json({ success: true, data }, { status: 201 });
}
