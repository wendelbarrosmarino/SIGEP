'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { User, Phone, CreditCard, Shield, Lock, Save } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  login: string
  crm?: string
  phone?: string
  role: string
  created_at: string
}

export default function ProfileClient({ user }: { user: UserProfile }) {
  const [phone, setPhone] = useState(user.phone || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const savePhone = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/employees/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    setPwError('')
    if (pwForm.next !== pwForm.confirm) { setPwError('As senhas não coincidem'); return }
    if (pwForm.next.length < 8) { setPwError('Mínimo 8 caracteres'); return }
    setPwSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar senha')
      setPwSuccess(true)
      setPwForm({ current: '', next: '', confirm: '' })
      setTimeout(() => setPwSuccess(false), 5000)
    } catch (e: any) {
      setPwError(e.message)
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Suas informações no SIGEP</p>
      </div>

      {/* Avatar + info */}
      <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
          {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
        </div>
        <div>
          <div className="font-semibold text-lg">{user.name}</div>
          <div className="text-sm text-muted-foreground">{user.login}</div>
          <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            <Shield className="h-3 w-3" />
            {user.role === 'RT' ? 'Responsável Técnico' : 'Plantonista'}
          </span>
        </div>
      </div>

      {/* Info fields */}
      <section className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dados pessoais</h2>
        <div className="space-y-3">
          {user.crm && (
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">CRM</div>
                <div className="text-sm font-medium">{user.crm}</div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">Usuário</div>
              <div className="text-sm font-medium">{user.login}</div>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5 flex items-center gap-1">
              <Phone className="h-3 w-3" />
              WhatsApp (para notificações)
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+55 69 99999-9999"
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button onClick={savePhone} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                <Save className="h-3.5 w-3.5" />
                {saving ? '...' : saved ? '✓' : 'Salvar'}
              </button>
            </div>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        </div>
        <div className="text-xs text-muted-foreground pt-1 border-t">
          Conta criada em {format(parseISO(user.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>
      </section>

      {/* Change password */}
      <section className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Alterar senha
        </h2>
        {pwSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm rounded-lg px-3 py-2">
            Senha alterada com sucesso!
          </div>
        )}
        {pwError && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-lg px-3 py-2">
            {pwError}
          </div>
        )}
        <div className="space-y-3">
          {(['current', 'next', 'confirm'] as const).map((field) => (
            <div key={field}>
              <label className="text-sm font-medium block mb-1">
                {field === 'current' ? 'Senha atual' : field === 'next' ? 'Nova senha' : 'Confirmar nova senha'}
              </label>
              <input
                type="password"
                value={pwForm[field]}
                onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
          <button onClick={changePassword} disabled={pwSaving}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {pwSaving ? 'Alterando...' : 'Alterar senha'}
          </button>
        </div>
      </section>
    </div>
  )
}
