import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/services/auth.service'
import { auditService } from '@/lib/services/audit.service'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration_hours: z.number().min(1).max(24).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  is_overnight: z.boolean().optional(),
  max_staff: z.number().int().min(1).optional(),
  min_staff: z.number().int().min(1).optional(),
  is_active: z.boolean().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('sigep_token')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('shifts').select('*').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: 'Turno não encontrado' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('sigep_token')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || payload.role !== 'RT') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('shifts')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Erro ao atualizar turno' }, { status: 500 })

  await auditService.log({
    userId: payload.userId,
    action: 'UPDATE',
    tableName: 'shifts',
    recordId: params.id,
    newValues: parsed.data,
  })

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('sigep_token')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload || payload.role !== 'RT') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const supabase = createAdminClient()
  // soft delete
  const { error } = await supabase
    .from('shifts')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: 'Erro ao desativar turno' }, { status: 500 })

  await auditService.log({
    userId: payload.userId,
    action: 'DELETE',
    tableName: 'shifts',
    recordId: params.id,
    newValues: { is_active: false },
  })

  return NextResponse.json({ success: true })
}
