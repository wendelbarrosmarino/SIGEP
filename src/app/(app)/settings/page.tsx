'use client'

import { useState, useEffect } from 'react'
import { Save, Settings, Bell, Shield, Clock, Building2 } from 'lucide-react'

interface SystemSettings {
  id: string
  hospital_name: string
  min_lead_time_days: number
  max_shifts_per_month: number
  min_rest_hours_between_shifts: number
  whatsapp_enabled: boolean
  push_notifications_enabled: boolean
  schedule_auto_publish: boolean
  lgpd_retention_days: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => { setSettings(data); setLoading(false) })
      .catch(() => { setError('Erro ao carregar configurações'); setLoading(false) })
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erro ao salvar')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )

  if (!settings) return (
    <div className="text-center text-muted-foreground py-12">
      {error || 'Configurações não encontradas'}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground text-sm mt-1">Parâmetros gerais do SIGEP</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : saved ? 'Salvo ✓' : 'Salvar alterações'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Hospital */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          <Building2 className="h-4 w-4" />
          Hospital
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Nome do Hospital</label>
          <input
            type="text"
            value={settings.hospital_name}
            onChange={e => setSettings(s => s ? { ...s, hospital_name: e.target.value } : s)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </section>

      {/* Scheduling rules */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          <Clock className="h-4 w-4" />
          Regras de Escala
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Antecedência mínima (dias)</label>
            <input
              type="number"
              min={0} max={30}
              value={settings.min_lead_time_days}
              onChange={e => setSettings(s => s ? { ...s, min_lead_time_days: parseInt(e.target.value) || 0 } : s)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Para solicitações de folga/troca</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Máx. plantões por mês</label>
            <input
              type="number"
              min={1} max={31}
              value={settings.max_shifts_per_month}
              onChange={e => setSettings(s => s ? { ...s, max_shifts_per_month: parseInt(e.target.value) || 1 } : s)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Descanso mínimo entre plantões (h)</label>
            <input
              type="number"
              min={0} max={72}
              value={settings.min_rest_hours_between_shifts}
              onChange={e => setSettings(s => s ? { ...s, min_rest_hours_between_shifts: parseInt(e.target.value) || 0 } : s)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div>
            <div className="text-sm font-medium">Publicar escala automaticamente</div>
            <div className="text-xs text-muted-foreground">Ao gerar nova escala, publicar imediatamente</div>
          </div>
          <button
            onClick={() => setSettings(s => s ? { ...s, schedule_auto_publish: !s.schedule_auto_publish } : s)}
            className={`relative w-11 h-6 rounded-full transition-colors ${settings.schedule_auto_publish ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.schedule_auto_publish ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          <Bell className="h-4 w-4" />
          Notificações
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Notificações Push</div>
              <div className="text-xs text-muted-foreground">Notificações no navegador/app</div>
            </div>
            <button
              onClick={() => setSettings(s => s ? { ...s, push_notifications_enabled: !s.push_notifications_enabled } : s)}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.push_notifications_enabled ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.push_notifications_enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">WhatsApp (CallMeBot)</div>
              <div className="text-xs text-muted-foreground">Enviar notificações via WhatsApp</div>
            </div>
            <button
              onClick={() => setSettings(s => s ? { ...s, whatsapp_enabled: !s.whatsapp_enabled } : s)}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.whatsapp_enabled ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.whatsapp_enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* LGPD */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          <Shield className="h-4 w-4" />
          Privacidade (LGPD)
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Retenção de dados (dias)</label>
          <input
            type="number"
            min={30} max={3650}
            value={settings.lgpd_retention_days}
            onChange={e => setSettings(s => s ? { ...s, lgpd_retention_days: parseInt(e.target.value) || 365 } : s)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Logs de auditoria e dados inativos são removidos após esse período. Mínimo: 30 dias.
          </p>
        </div>
      </section>
    </div>
  )
}
