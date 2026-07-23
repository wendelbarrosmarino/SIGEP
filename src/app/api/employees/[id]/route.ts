import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authService } from '@/lib/services/auth.service';
import { auditService } from '@/lib/services/audit.service';
import { createAdminClient } from '@/lib/supabase/server';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  isActive: z.boolean().optional(),
});

function requireRT(request: NextRequest) {
  const token = request.cookies.get('sigep_token')?.value;
  if (!token) return null;
  const payload = authService.verifyToken(token);
  if (!payload || payload.role !== 'RT') return null;
  return payload;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = requireRT(request);
  if (!payload) return NextResponse.json({ success: false }, { status: 403 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, name, crm, phone, login, role, is_active, is_first_access, created_at')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ success: false, error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json({ success: true, data });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = requireRT(request);
  if (!payload) return NextResponse.json({ success: false }, { status: 403 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 });

  const supabase = createAdminClient();
  const updates: Record<string, unknown> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.phone) updates.phone = parsed.data.phone;
  if (parsed.data.isActive !== undefined) updates.is_active = parsed.data.isActive;

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', params.id)
    .select('id, name, crm')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  await auditService.log({
    userId: payload.sub,
    action: 'EMPLOYEE_UPDATED',
    description: `Funcionário atualizado: ${data.name}`,
    ipAddress: ip,
    userAgent: ua,
    metadata: { employeeId: params.id, changes: parsed.data },
  });

  return NextResponse.json({ success: true, data });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = requireRT(request);
  if (!payload) return NextResponse.json({ success: false }, { status: 403 });

  const supabase = createAdminClient();

  // Soft delete — desativar em vez de apagar
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', params.id)
    .select('name')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  await auditService.log({
    userId: payload.sub,
    action: 'EMPLOYEE_DELETED',
    description: `Funcionário desativado: ${data.name}`,
    ipAddress: ip,
    userAgent: ua,
  });

  return NextResponse.json({ success: true });
}
