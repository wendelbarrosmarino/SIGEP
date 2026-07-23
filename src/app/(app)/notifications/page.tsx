'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bell, Check, CheckCheck } from 'lucide-react'

interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  created_at: string
  data?: Record<string, any>
}

const TYPE_ICONS: Record<string, string> = {
  schedule_published: '📅',
  leave_approved: '✅',
  leave_denied: '❌',
  swap_request: '🔄',
  swap_response: '🔄',
  swap_pending_rt: '⏳',
  general: '🔔',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const load = () => {
    fetch('/api/notifications?limit=50')
      .then(r => r.json())
      .then(d => { setNotifications(Array.isArray(d.data) ? d.data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const markOne = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAll = async () => {
    setMarkingAll(true)
    await fetch('/api/notifications', { method: 'PATCH' })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setMarkingAll(false)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo lido'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAll} disabled={markingAll}
            className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50">
            <CheckCheck className="h-4 w-4" />
            {markingAll ? 'Marcando...' : 'Marcar todas como lidas'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 border rounded-xl">
          <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sem notificações</p>
          <p className="text-sm mt-1">Você será notificado sobre escalas, folgas e trocas aqui</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map(n => (
            <button
              key={n.id}
              onClick={() => !n.read && markOne(n.id)}
              className={`w-full text-left flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
                n.read ? 'bg-card text-muted-foreground' : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
              }`}
            >
              <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.read ? '' : 'font-medium text-foreground'}`}>{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(parseISO(n.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              {!n.read && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
