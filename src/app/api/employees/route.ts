import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authService } from '@/lib/services/auth.service';
import { auditService } from '@/lib/services/audit.service';
import { createAdminClient } from '@/lib/supabase/server';

const createSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  crm: z.string().min(1, 'CRM obrigatório'),
  phone: z.string().min(10, 'Telefone inválido'),
  login: z.string().min(3, 'Login muito curto'),
  initialPassword: z.string().min(6, 'Senha inicial muito curta'),
  role: z.enum(['RT', 'EMPLOYEE']).default('EMPLOYEE'),
});

function requireRT(request: NextRequest) {
  const token = request.cookies.get('sigep_token')?.value;
  if (!token) return null;
  const payload = authService.verifyToken(token);
  if (!payload || payload.role !== 'RT') return null;
  return payload;
}

export async function GET(request: NextRequest) {
  const payload = requireRT(request);
  if (!payload) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 });

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  let query = supabase
    .from('users')
    .select('id, name, crm, phone, login, role, is_active, is_first_access, created_at, updated_at', { count: 'exact' })
    .eq('role', 'EMPLOYEE')
    .order('name')
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,crm.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data, total: count, page, limit });
}

export async function POST(request: NextRequest) {
  const payload = requireRT(request);
  if (!payload) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { name, crm, phone, login, initialPassword, role } = parsed.data;

  // Verificar unicidade
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .or(`crm.eq.${crm},login.eq.${login}`)
    .single();

  if (existing) {
    return NextResponse.json({ success: false, error: 'CRM ou Login já cadastrado' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(initialPassword, 12);

  const { data, error } = await supabase
    .from('users')
    .insert({ name, crm, phone, login, password_hash: passwordHash, role, is_first_access: true })
    .select('id, name, crm, phone, login, role, is_active, created_at')
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  await auditService.log({
    userId: payload.sub,
    action: 'EMPLOYEE_CREATED',
    description: `Funcionário criado: ${name} (CRM: ${crm})`,
    ipAddress: ip,
    userAgent: ua,
    metadata: { employeeId: data.id },
  });

  return NextResponse.json({ success: true, data }, { status: 201 });
}
