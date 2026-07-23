import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/services/auth.service'

// POST /api/notifications/push-subscribe
export async function POST(req: NextRequest) {
  const token = req.cookies.get('sigep_token')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const subscription = await req.json()
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Subscription inválida' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: payload.userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys?.p256dh,
      auth: subscription.keys?.auth,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,endpoint' })

  if (error) return NextResponse.json({ error: 'Erro ao salvar subscription' }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE /api/notifications/push-subscribe
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('sigep_token')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const { endpoint } = await req.json()
  const supabase = createAdminClient()

  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', payload.userId)
    .eq('endpoint', endpoint)

  return NextResponse.json({ success: true })
}
