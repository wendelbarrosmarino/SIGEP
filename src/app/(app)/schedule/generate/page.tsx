'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react'
import { format, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function GenerateSchedulePage() {
  const router = useRouter()
  const now = new Date()
  const nextMonth = addMonths(now, 1)

  const [month, setMonth] = useState(nextMonth.getMonth() + 1)
  const [year, setYear] = useState(nextMonth.getFullYear())
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{ scheduleId: string; conflicts: any[] } | null>(null)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar escala')
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const monthLabel = format(new Date(year, month - 1, 1), "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Gerar escala</h1>
          <p className="text-muted-foreground text-sm">Geração automática de escala mensal</p>
        </div>
      </div>

      {!result ? (
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <div>
            <p className="text-sm text-muted-foreground">
              O sistema irá distribuir automaticamente os plantonistas nos turnos configurados,
              respeitando folgas aprovadas, limites de escala e horas de descanso.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Mês</label>
              <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>
                    {format(new Date(2024, m - 1, 1), 'MMMM', { locale: ptBR })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Ano</label>
              <select value={year} onChange={e => setYear(parseInt(e.target.value))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {[now.getFullYear(), now.getFullYear() + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Se já existir uma escala para <strong>{monthLabel}</strong>, ela será substituída.
              Solicitações aprovadas serão respeitadas automaticamente.
            </span>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <button onClick={handleGenerate} disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            <Sparkles className="h-4 w-4" />
            {generating ? 'Gerando escala...' : `Gerar escala de ${monthLabel}`}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-semibold">Escala gerada com sucesso!</div>
                <div className="text-sm text-muted-foreground">{monthLabel}</div>
              </div>
            </div>

            {result.conflicts && result.conflicts.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {result.conflicts.length} conflito{result.conflicts.length > 1 ? 's' : ''} encontrado{result.conflicts.length > 1 ? 's' : ''}:
                </p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {result.conflicts.map((c: any, i: number) => (
                    <div key={i} className={`text-xs px-3 py-2 rounded-lg ${
                      c.severity === 'ERROR'
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                    }`}>
                      {c.message}
                    </div>
                  ))}
                </div>
                {result.conflicts.some((c: any) => c.severity === 'ERROR') && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Conflitos de erro impedem a publicação. Resolva-os antes de publicar.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-green-700 dark:text-green-300">
                Nenhum conflito encontrado. A escala está pronta para publicação.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/schedule?id=${result.scheduleId}`)}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 text-sm transition-colors">
              Ver e publicar escala
            </button>
            <button
              onClick={() => { setResult(null); setError('') }}
              className="px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-accent transition-colors">
              Gerar outro mês
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
