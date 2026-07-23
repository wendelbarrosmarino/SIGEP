import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/services/auth.service'
import { auditService } from '@/lib/services/audit.service'
import { z } from 'zod'

const settingsSchema = z.object({
  hospital_name: z.string().min(1).optional(),
  min_lead_time_days: z.number().int().min(0).max(30).optional(),
  max_shifts_per_month: z.number().int().min(1).max(31).optional(),
  min_rest_hours_between_shifts: z.number().int().min(0).max(72).optional(),
  whatsapp_enabled: z.boolean().optional(),
  push_notifications_enabled: z.boolean().optional(),
  schedule_auto_publish: z.boolean().optional(),
  lgpd_retention_days: z.number().int().min(30).max(3650).optional(),
})

// GET /api/settings
export async function GET(req: NextRequest) {
  const token = req.cookies.get('sigep_token')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: 'Configurações não encontradas' }, { status: 404 })
  return NextResponse.json(data)
}

// PATCH /api/settings — RT only
export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('sigep_token')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  if (payload.role !== 'RT') {
    return NextResponse.json({ error: 'Apenas RT pode alterar configurações' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('system_settings')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .not('id', 'is', null)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })

  await auditService.log({
    userId: payload.userId,
    action: 'UPDATE',
    tableName: 'system_settings',
    recordId: data.id,
    newValues: parsed.data,
  })

  return NextResponse.json(data)
}
