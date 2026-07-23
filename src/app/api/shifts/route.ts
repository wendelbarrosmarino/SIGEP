import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/services/auth.service'
import { auditService } from '@/lib/services/audit.service'
import { z } from 'zod'

const shiftSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(10),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  duration_hours: z.number().min(1).max(24),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  is_overnight: z.boolean().optional(),
  max_staff: z.number().int().min(1).optional(),
  min_staff: z.number().int().min(1).optional(),
})

// GET /api/shifts
export async function GET(req: NextRequest) {
  const token = req.cookies.get('sigep_token')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('is_active', true)
    .order('start_time')

  if (error) return NextResponse.json({ error: 'Erro ao buscar turnos' }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/shifts — RT only
export async function POST(req: NextRequest) {
  const token = req.cookies.get('sigep_token')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  if (payload.role !== 'RT') {
    return NextResponse.json({ error: 'Apenas RT pode gerenciar turnos' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = shiftSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const supabase = createAdminClient()

  // Check code uniqueness
  const { data: existing } = await supabase
    .from('shifts')
    .select('id')
    .eq('code', parsed.data.code)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Código de turno já existe' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('shifts')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Erro ao criar turno' }, { status: 500 })

  await auditService.log({
    userId: payload.userId,
    action: 'CREATE',
    tableName: 'shifts',
    recordId: data.id,
    newValues: parsed.data,
  })

  return NextResponse.json(data, { status: 201 })
}
