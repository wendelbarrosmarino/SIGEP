'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, ArrowLeftRight, Plus, Clock } from 'lucide-react'

type Tab = 'leave' | 'swap'

interface LeaveRequest {
  id: string
  date: string
  reason: string
  status: string
  rt_comment?: string
  created_at: string
}

interface SwapRequest {
  id: string
  status: string
  requester_comment?: string
  rt_comment?: string
  created_at: string
  requester_entry?: { date: string; shift?: { name: string } }
  target_entry?: { date: string; shift?: { name: string } }
  target?: { name: string }
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  DENIED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  ACCEPTED_BY_TARGET: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  REJECTED_BY_TARGET: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  DENIED: 'Negado',
  ACCEPTED_BY_TARGET: 'Aceito pelo colega — aguarda RT',
  REJECTED_BY_TARGET: 'Recusado pelo colega',
}

export default function RequestsPage() {
  const [tab, setTab] = useState<Tab>('leave')
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [swaps, setSwaps] = useState<SwapRequest[]>([])
  const [loadingLeave, setLoadingLeave] = useState(true)
  const [loadingSwap, setLoadingSwap] = useState(true)
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ date: '', reason: '' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetch('/api/requests/leave').then(r => r.json()).then(d => {
      setLeaves(Array.isArray(d.data) ? d.data : [])
      setLoadingLeave(false)
    }).catch(() => setLoadingLeave(false))

    fetch('/api/requests/swap').then(r => r.json()).then(d => {
      setSwaps(Array.isArray(d.data) ? d.data : [])
      setLoadingSwap(false)
    }).catch(() => setLoadingSwap(false))
  }, [])

  const submitLeave = async () => {
    if (!leaveForm.date) { setFormError('Selecione a data'); return }
    setSubmitting(true)
    setFormError('')
    try {
      const res = await fetch('/api/requests/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar')
      setLeaves(prev => [data, ...prev])
      setShowLeaveForm(false)
      setLeaveForm({ date: '', reason: '' })
    } catch (e: any) {
      setFormError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minhas solicitações</h1>
          <p className="text-muted-foreground text-sm mt-1">Folgas e trocas de plantão</p>
        </div>
        {tab === 'leave' && !showLeaveForm && (
          <button onClick={() => setShowLeaveForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Solicitar folga
          </button>
        )}
        {tab === 'swap' && (
          <a href="/requests/swap/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Solicitar troca
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-muted p-1 gap-1">
        {([['leave', 'Folgas', FileText], ['swap', 'Trocas', ArrowLeftRight]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === key ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}>
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Leave request form */}
      {tab === 'leave' && showLeaveForm && (
        <div className="rounded-xl border-2 border-primary/40 bg-card p-5 space-y-4">
          <div className="font-semibold text-sm">Nova solicitação de folga</div>
          {formError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-lg px-3 py-2">{formError}</div>
          )}
          <div>
            <label className="text-sm font-medium block mb-1.5">Data da folga</label>
            <input type="date" value={leaveForm.date}
              onChange={e => setLeaveForm(f => ({ ...f, date: e.target.value }))}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Motivo (opcional)</label>
            <textarea value={leaveForm.reason} rows={3}
              onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Descreva o motivo da solicitação..." />
          </div>
          <div className="flex gap-2">
            <button onClick={submitLeave} disabled={submitting}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {submitting ? 'Enviando...' : 'Enviar solicitação'}
            </button>
            <button onClick={() => { setShowLeaveForm(false); setFormError('') }}
              className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Leave list */}
      {tab === 'leave' && (
        loadingLeave ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 border rounded-xl">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>Nenhuma solicitação de folga</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaves.map(req => (
              <div key={req.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm">
                      {format(parseISO(req.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                    {req.reason && <div className="text-xs text-muted-foreground mt-0.5">{req.reason}</div>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${STATUS_BADGE[req.status] || ''}`}>
                    {STATUS_LABEL[req.status] || req.status}
                  </span>
                </div>
                {req.rt_comment && (
                  <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                    <span className="font-medium">RT: </span>{req.rt_comment}
                  </div>
                )}
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Solicitado em {format(parseISO(req.created_at), "dd/MM/yyyy 'às' HH:mm")}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Swap list */}
      {tab === 'swap' && (
        loadingSwap ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : swaps.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 border rounded-xl">
            <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>Nenhuma solicitação de troca</p>
          </div>
        ) : (
          <div className="space-y-2">
            {swaps.map(req => (
              <div key={req.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm">
                      Troca com {req.target?.name || 'colega'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {req.requester_entry?.shift?.name} ({req.requester_entry?.date && format(parseISO(req.requester_entry.date), 'dd/MM')})
                      {' ↔ '}
                      {req.target_entry?.shift?.name} ({req.target_entry?.date && format(parseISO(req.target_entry.date), 'dd/MM')})
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${STATUS_BADGE[req.status] || ''}`}>
                    {STATUS_LABEL[req.status] || req.status}
                  </span>
                </div>
                {req.rt_comment && (
                  <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                    <span className="font-medium">RT: </span>{req.rt_comment}
                  </div>
                )}
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Solicitado em {format(parseISO(req.created_at), "dd/MM/yyyy 'às' HH:mm")}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
