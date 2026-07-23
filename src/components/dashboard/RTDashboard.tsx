'use client';

import Link from 'next/link';
import { Users, Clock, CheckSquare, AlertCircle, CalendarPlus, Send, Settings, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RTDashboardProps {
  data: {
    todayShifts: Array<{
      shift_name: string;
      shift_code: string;
      shift_color: string;
      shift_start: string;
      shift_end: string;
      user_name: string;
    }>;
    pendingLeaves: number;
    pendingSwaps: number;
    totalEmployees: number;
    recentLogs: Array<{
      id: string;
      action: string;
      description: string;
      created_at: string;
      user?: { name: string };
    }>;
  };
}

const actionLabels: Record<string, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  EMPLOYEE_CREATED: 'Funcionário criado',
  EMPLOYEE_UPDATED: 'Funcionário atualizado',
  SCHEDULE_PUBLISHED: 'Escala publicada',
  REQUEST_APPROVED: 'Solicitação aprovada',
  REQUEST_DENIED: 'Solicitação negada',
  SWAP_APPROVED: 'Troca aprovada',
  PASSWORD_CHANGED: 'Senha alterada',
};

export function RTDashboard({ data }: RTDashboardProps) {
  const pending = data.pendingLeaves + data.pendingSwaps;

  // Agrupar plantões do dia por turno
  const shiftGroups = data.todayShifts.reduce<Record<string, typeof data.todayShifts>>((acc, entry) => {
    const key = entry.shift_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Funcionários"
          value={data.totalEmployees}
          icon={<Users className="w-5 h-5 text-blue-500" />}
          color="blue"
          href="/employees"
        />
        <StatCard
          title="Folgas Pendentes"
          value={data.pendingLeaves}
          icon={<ClipboardList className="w-5 h-5 text-yellow-500" />}
          color="yellow"
          href="/approvals"
          alert={data.pendingLeaves > 0}
        />
        <StatCard
          title="Trocas Pendentes"
          value={data.pendingSwaps}
          icon={<CheckSquare className="w-5 h-5 text-orange-500" />}
          color="orange"
          href="/approvals"
          alert={data.pendingSwaps > 0}
        />
        <StatCard
          title="Total Pendentes"
          value={pending}
          icon={<AlertCircle className="w-5 h-5 text-red-500" />}
          color="red"
          href="/approvals"
          alert={pending > 0}
        />
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/schedule/generate">
              <Button variant="outline" className="w-full flex-col h-auto py-4 gap-2 hover:border-primary hover:text-primary">
                <CalendarPlus className="w-5 h-5" />
                <span className="text-xs">Gerar Escala</span>
              </Button>
            </Link>
            <Link href="/schedule">
              <Button variant="outline" className="w-full flex-col h-auto py-4 gap-2 hover:border-primary hover:text-primary">
                <Send className="w-5 h-5" />
                <span className="text-xs">Publicar Escala</span>
              </Button>
            </Link>
            <Link href="/employees/new">
              <Button variant="outline" className="w-full flex-col h-auto py-4 gap-2 hover:border-primary hover:text-primary">
                <Users className="w-5 h-5" />
                <span className="text-xs">Novo Funcionário</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full flex-col h-auto py-4 gap-2 hover:border-primary hover:text-primary">
                <Settings className="w-5 h-5" />
                <span className="text-xs">Configurações</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Plantões de Hoje */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Plantões de Hoje</CardTitle>
            <Link href="/schedule">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Ver escala completa</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {Object.keys(shiftGroups).length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhum plantão registrado para hoje.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(shiftGroups).map(([shiftName, entries]) => (
                  <div key={shiftName}>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entries[0].shift_color }}
                      />
                      <span className="text-sm font-medium">{shiftName}</span>
                      <span className="text-xs text-muted-foreground">
                        {entries[0].shift_start} – {entries[0].shift_end}
                      </span>
                    </div>
                    <div className="pl-4 space-y-1">
                      {entries.map((e, i) => (
                        <p key={i} className="text-sm text-muted-foreground">{e.user_name}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimas Alterações */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Últimas Alterações</CardTitle>
            <Link href="/audit">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Ver auditoria</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentLogs.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Sem registros recentes.</p>
            ) : (
              <div className="space-y-3">
                {data.recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{log.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.user?.name} • {format(parseISO(log.created_at), "dd/MM HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Aprovações */}
      {pending > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                {pending} solicitaç{pending === 1 ? 'ão pendente' : 'ões pendentes'} aguardando sua análise
              </p>
            </div>
            <Link href="/approvals">
              <Button size="sm" variant="outline" className="border-yellow-400 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-400">
                Analisar
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color, href, alert }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  href: string;
  alert?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-950/30',
    yellow: 'bg-yellow-50 dark:bg-yellow-950/30',
    orange: 'bg-orange-50 dark:bg-orange-950/30',
    red: 'bg-red-50 dark:bg-red-950/30',
  };

  return (
    <Link href={href}>
      <div className={`stat-card cursor-pointer ${alert ? 'border-yellow-300 dark:border-yellow-800' : ''}`}>
        <div className={`w-9 h-9 rounded-lg ${colorMap[color]} flex items-center justify-center mb-3`}>
          {icon}
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
      </div>
    </Link>
  );
}
