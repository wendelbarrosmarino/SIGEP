import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/services/auth.service'

// GET /api/notifications
export async function GET(req: NextRequest) {
  const token = req.cookies.get('sigep_token')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const unreadOnly = searchParams.get('unread') === 'true'

  const supabase = createAdminClient()
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', payload.userId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (unreadOnly) query = query.eq('read', false)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 })

  return NextResponse.json({
    data,
    pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
  })
}

// PATCH /api/notifications — mark all as read
export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('sigep_token')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('user_id', payload.userId)
    .eq('read', false)

  if (error) return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  return NextResponse.json({ success: true })
}
