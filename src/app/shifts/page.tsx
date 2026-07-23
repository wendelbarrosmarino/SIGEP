'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Clock, Save, X } from 'lucide-react'

interface Shift {
  id: string
  name: string
  code: string
  start_time: string
  end_time: string
  duration_hours: number
  color: string
  is_overnight: boolean
  max_staff: number
  min_staff: number
  is_active: boolean
}

const BLANK: Omit<Shift, 'id' | 'is_active'> = {
  name: '', code: '', start_time: '07:00', end_time: '19:00',
  duration_hours: 12, color: '#0078D4', is_overnight: false, max_staff: 10, min_staff: 1,
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<Omit<Shift, 'id' | 'is_active'>>(BLANK)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/shifts')
      .then(r => r.json())
      .then(data => { setShifts(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const startEdit = (s: Shift) => {
    setEditing(s.id)
    setCreating(false)
    setForm({ name: s.name, code: s.code, start_time: s.start_time, end_time: s.end_time,
      duration_hours: s.duration_hours, color: s.color, is_overnight: s.is_overnight,
      max_staff: s.max_staff, min_staff: s.min_staff })
    setError('')
  }

  const startCreate = () => {
    setCreating(true)
    setEditing(null)
    setForm(BLANK)
    setError('')
  }

  const cancel = () => { setEditing(null); setCreating(false); setError('') }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const url = editing ? `/api/shifts/${editing}` : '/api/shifts'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erro ao salvar')
      }
      cancel()
      load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const deactivate = async (id: string) => {
    if (!confirm('Desativar este turno?')) return
    await fetch(`/api/shifts/${id}`, { method: 'DELETE' })
    load()
  }

  const ShiftForm = () => (
    <div className="rounded-xl border-2 border-primary/40 bg-card p-5 space-y-4">
      <div className="font-semibold text-sm">{creating ? 'Novo turno' : 'Editar turno'}</div>
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-lg px-3 py-2">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Nome</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Plantão Diurno" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Código</label>
          <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="PD" maxLength={10} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Início</label>
          <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Fim</label>
          <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Duração (horas)</label>
          <input type="number" min={1} max={24} value={form.duration_hours}
            onChange={e => setForm(f => ({ ...f, duration_hours: parseInt(e.target.value) || 12 }))}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Cor</label>
          <div className="flex items-center gap-2">
            <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              className="h-8 w-12 rounded cursor-pointer border" />
            <span className="text-sm font-mono text-muted-foreground">{form.color}</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Mín. plantonistas</label>
          <input type="number" min={1} value={form.min_staff}
            onChange={e => setForm(f => ({ ...f, min_staff: parseInt(e.target.value) || 1 }))}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Máx. plantonistas</label>
          <input type="number" min={1} value={form.max_staff}
            onChange={e => setForm(f => ({ ...f, max_staff: parseInt(e.target.value) || 1 }))}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="overnight" checked={form.is_overnight}
          onChange={e => setForm(f => ({ ...f, is_overnight: e.target.checked }))}
          className="rounded" />
        <label htmlFor="overnight" className="text-sm">Plantão vira a madrugada (noturno)</label>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        <button onClick={cancel}
          className="flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-accent">
          <X className="h-3.5 w-3.5" />
          Cancelar
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Turnos</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie os tipos de plantão</p>
        </div>
        {!creating && !editing && (
          <button onClick={startCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Novo turno
          </button>
        )}
      </div>

      {creating && <ShiftForm />}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : shifts.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 border rounded-xl">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>Nenhum turno cadastrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shifts.map(shift => (
            <div key={shift.id}>
              {editing === shift.id ? (
                <ShiftForm />
              ) : (
                <div className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: shift.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium flex items-center gap-2">
                      {shift.name}
                      <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{shift.code}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {shift.start_time} – {shift.end_time} · {shift.duration_hours}h
                      {shift.is_overnight && ' · Noturno'}
                      · {shift.min_staff}–{shift.max_staff} plantonistas
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(shift)}
                      className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => deactivate(shift.id)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
