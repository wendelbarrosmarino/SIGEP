import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/services/auth.service'
import { auditService } from '@/lib/services/audit.service'

// GET /api/audit — RT only
export async function GET(req: NextRequest) {
  const token = req.cookies.get('sigep_token')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  if (payload.role !== 'RT') {
    return NextResponse.json({ error: 'Acesso restrito ao RT' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const userId = searchParams.get('userId') || undefined
  const action = searchParams.get('action') || undefined
  const tableName = searchParams.get('table') || undefined
  const dateFrom = searchParams.get('from') || undefined
  const dateTo = searchParams.get('to') || undefined

  const result = await auditService.getAll({
    userId,
    action: action as any,
    tableName,
    dateFrom,
    dateTo,
    page,
    limit,
  })

  return NextResponse.json(result)
}
