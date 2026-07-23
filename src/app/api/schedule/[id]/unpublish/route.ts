import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/services/auth.service'
import { auditService } from '@/lib/services/audit.service'

// POST /api/schedule/[id]/unpublish — RT only
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('sigep_token')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload || payload.role !== 'RT') {
    return NextResponse.json({ error: 'Apenas RT pode despublicar escalas' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('schedules')
    .update({ status: 'DRAFT', published_at: null, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Escala não encontrada' }, { status: 404 })

  await auditService.log({
    userId: payload.userId,
    action: 'UPDATE',
    tableName: 'schedules',
    recordId: params.id,
    newValues: { status: 'DRAFT' },
  })

  return NextResponse.json({ success: true, schedule: data })
}
