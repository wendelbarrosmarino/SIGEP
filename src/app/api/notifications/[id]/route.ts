import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/services/auth.service'

// PATCH /api/notifications/[id] — mark single notification as read
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('sigep_token')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', payload.userId)

  if (error) return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  return NextResponse.json({ success: true })
}
