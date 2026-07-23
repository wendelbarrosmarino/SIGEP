import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/services/auth.service'
import { auditService } from '@/lib/services/audit.service'
import { notificationService } from '@/lib/services/notification.service'
import { z } from 'zod'

const reviewSchema = z.object({
  action: z.enum(['accept', 'reject', 'approve', 'deny']),
  comment: z.string().optional(),
})

// GET /api/requests/swap/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('sigep_token')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('swap_requests')
    .select(`
      *,
      requester:users!requester_id(id, name, crm),
      target:users!target_id(id, name, crm),
      requester_entry:schedule_entries!requester_entry_id(*, shift:shifts(*)),
      target_entry:schedule_entries!target_entry_id(*, shift:shifts(*))
    `)
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })

  // employees can only see their own
  if (payload.role === 'EMPLOYEE' &&
    data.requester_id !== payload.userId &&
    data.target_id !== payload.userId) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  return NextResponse.json(data)
}

// PATCH /api/requests/swap/[id] — accept (target) or approve/deny (RT)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('sigep_token')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const body = await req.json()
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { action, comment } = parsed.data

  const supabase = createAdminClient()

  // Load the request
  const { data: swapReq, error: fetchError } = await supabase
    .from('swap_requests')
    .select('*, requester:users!requester_id(id, name), target:users!target_id(id, name)')
    .eq('id', params.id)
    .single()

  if (fetchError || !swapReq) {
    return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
  }

  // Target user accepts/rejects
  if (action === 'accept' || action === 'reject') {
    if (payload.role !== 'EMPLOYEE' || swapReq.target_id !== payload.userId) {
      return NextResponse.json({ error: 'Somente o funcionário alvo pode aceitar/rejeitar' }, { status: 403 })
    }
    if (swapReq.status !== 'PENDING') {
      return NextResponse.json({ error: 'Solicitação não está pendente de aceitação' }, { status: 400 })
    }

    const newStatus = action === 'accept' ? 'ACCEPTED_BY_TARGET' : 'REJECTED_BY_TARGET'
    const { error: updateError } = await supabase
      .from('swap_requests')
      .update({ status: newStatus, target_comment: comment, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    if (updateError) return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })

    // Notify requester
    await notificationService.notify(swapReq.requester_id, 'swap_response', {
      message: action === 'accept'
        ? `${swapReq.target.name} aceitou sua solicitação de troca. Aguardando aprovação do RT.`
        : `${swapReq.target.name} recusou sua solicitação de troca.${comment ? ` Motivo: ${comment}` : ''}`,
      swapRequestId: params.id,
    })

    // Notify RTs if accepted
    if (action === 'accept') {
      await notificationService.notifyRTs('swap_pending_rt', {
        message: `Troca entre ${swapReq.requester.name} e ${swapReq.target.name} aguarda aprovação.`,
        swapRequestId: params.id,
      })
    }

    await auditService.log({
      userId: payload.userId,
      action: 'UPDATE',
      tableName: 'swap_requests',
      recordId: params.id,
      newValues: { status: newStatus },
    })

    return NextResponse.json({ success: true, status: newStatus })
  }

  // RT approves/denies
  if (action === 'approve' || action === 'deny') {
    if (payload.role !== 'RT') {
      return NextResponse.json({ error: 'Apenas RT pode aprovar ou negar' }, { status: 403 })
    }
    if (swapReq.status !== 'ACCEPTED_BY_TARGET') {
      return NextResponse.json({ error: 'Troca ainda não foi aceita pelo funcionário alvo' }, { status: 400 })
    }
    if (action === 'deny' && !comment?.trim()) {
      return NextResponse.json({ error: 'Comentário obrigatório ao negar solicitação' }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'DENIED'

    if (action === 'approve') {
      // Swap the entries in schedule
      const { data: reqEntry } = await supabase
        .from('schedule_entries')
        .select('*')
        .eq('id', swapReq.requester_entry_id)
        .single()

      const { data: tgtEntry } = await supabase
        .from('schedule_entries')
        .select('*')
        .eq('id', swapReq.target_entry_id)
        .single()

      if (reqEntry && tgtEntry) {
        await supabase
          .from('schedule_entries')
          .update({ user_id: tgtEntry.user_id })
          .eq('id', reqEntry.id)

        await supabase
          .from('schedule_entries')
          .update({ user_id: reqEntry.user_id })
          .eq('id', tgtEntry.id)
      }
    }

    await supabase
      .from('swap_requests')
      .update({
        status: newStatus,
        rt_comment: comment,
        reviewed_by: payload.userId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    const msg = action === 'approve'
      ? 'Sua troca de plantão foi aprovada pelo RT.'
      : `Sua troca de plantão foi negada pelo RT.${comment ? ` Motivo: ${comment}` : ''}`

    await notificationService.notify(swapReq.requester_id, 'swap_response', { message: msg, swapRequestId: params.id })
    await notificationService.notify(swapReq.target_id, 'swap_response', { message: msg, swapRequestId: params.id })

    await auditService.log({
      userId: payload.userId,
      action: 'UPDATE',
      tableName: 'swap_requests',
      recordId: params.id,
      newValues: { status: newStatus, rt_comment: comment },
    })

    return NextResponse.json({ success: true, status: newStatus })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
