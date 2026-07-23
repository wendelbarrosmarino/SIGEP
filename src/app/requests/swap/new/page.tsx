'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, ArrowLeftRight, Search } from 'lucide-react'

interface ScheduleEntry {
  id: string
  date: string
  shift: { name: string; code: string; color: string; start_time: string; end_time: string }
}

interface Employee {
  id: string
  name: string
  crm?: string
}

export default function NewSwapPage() {
  const router = useRouter()
  const [myEntries, setMyEntries] = useState<ScheduleEntry[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [targetEntries, setTargetEntries] = useState<ScheduleEntry[]>([])

  const [myEntryId, setMyEntryId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [targetEntryId, setTargetEntryId] = useState('')
  const [comment, setComment] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const now = new Date()
    const params = new URLSearchParams({ month: String(now.getMonth() + 1), year: String(now.getFullYear()) })

    Promise.all([
      fetch(`/api/schedule?${params}`).then(r => r.json()),
      fetch('/api/employees').then(r => r.json()),
    ]).then(([schedData, empData]) => {
      // Filter to own entries
      const entries = (schedData.entries || []).filter((e: any) => e.is_own === true || e.mine === true)
      setMyEntries(entries)
      setEmployees((empData.data || []))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!targetId) { setTargetEntries([]); setTargetEntryId(''); return }
    const now = new Date()
    const params = new URLSearchParams({
      month: String(now.getMonth() + 1),
      year: String(now.getFullYear()),
      userId: targetId,
    })
    fetch(`/api/schedule?${params}`)
      .then(r => r.json())
      .then(data => setTargetEntries(data.entries || []))
  }, [targetId])

  const handleSubmit = async () => {
    if (!myEntryId || !targetId || !targetEntryId) {
      setError('Preencha todos os campos obrigatórios')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/requests/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEntryId: myEntryId,
          targetId,
          targetEntryId,
          comment,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar solicitação')
      router.push('/requests?tab=swap')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Solicitar troca de plantão</h1>
          <p className="text-muted-foreground text-sm">Escolha os turnos a trocar</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* My shift */}
        <div>
          <label className="text-sm font-medium block mb-1.5">Meu plantão (que quero ceder)</label>
          <select value={myEntryId} onChange={e => setMyEntryId(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Selecione um plantão...</option>
            {myEntries.map(entry => (
              <option key={entry.id} value={entry.id}>
                {format(parseISO(entry.date), "dd/MM/yyyy")} — {entry.shift?.name} ({entry.shift?.start_time}–{entry.shift?.end_time})
              </option>
            ))}
          </select>
          {myEntries.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">Nenhum plantão encontrado na escala atual</p>
          )}
        </div>

        <div className="flex items-center justify-center">
          <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Target employee */}
        <div>
          <label className="text-sm font-medium block mb-1.5">Colega</label>
          <select value={targetId} onChange={e => { setTargetId(e.target.value); setTargetEntryId('') }}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Selecione o colega...</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name}{emp.crm ? ` (${emp.crm})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Target shift */}
        {targetId && (
          <div>
            <label className="text-sm font-medium block mb-1.5">Plantão do colega (que vou assumir)</label>
            <select value={targetEntryId} onChange={e => setTargetEntryId(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Selecione o plantão do colega...</option>
              {targetEntries.map(entry => (
                <option key={entry.id} value={entry.id}>
                  {format(parseISO(entry.date), "dd/MM/yyyy")} — {entry.shift?.name} ({entry.shift?.start_time}–{entry.shift?.end_time})
                </option>
              ))}
            </select>
            {targetEntries.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">Colega não tem plantões na escala atual</p>
            )}
          </div>
        )}

        {/* Comment */}
        <div>
          <label className="text-sm font-medium block mb-1.5">Comentário (opcional)</label>
          <textarea value={comment} rows={2}
            onChange={e => setComment(e.target.value)}
            placeholder="Motivo da troca..."
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 text-sm transition-colors">
            {submitting ? 'Enviando...' : 'Enviar solicitação de troca'}
          </button>
          <button onClick={() => router.back()}
            className="px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-accent transition-colors">
            Cancelar
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        O colega receberá uma notificação para aceitar ou recusar. Após aceitação, o RT irá aprovar a troca.
      </p>
    </div>
  )
}
