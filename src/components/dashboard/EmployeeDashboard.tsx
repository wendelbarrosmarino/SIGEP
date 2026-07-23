'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, ClipboardList, Bell, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EmployeeDashboardProps {
  data: {
    nextShift?: {
      date: string;
      shift_name: string;
      shift_code: string;
      shift_color: string;
      shift_start: string;
      shift_end: string;
    } | null;
    monthShiftsCount: number;
    pendingRequests: Array<{ id: string; date: string; status: string }>;
    unreadCount: number;
  };
}

export function EmployeeDashboard({ data }: EmployeeDashboardProps) {
  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mb-3">
              <CalendarDays className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{data.monthShiftsCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Plantões este mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center mb-3">
              <ClipboardList className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold">{data.pendingRequests.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Solicitações pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Próximo plantão */}
      {data.nextShift ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary">Próximo Plantão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{ backgroundColor: data.nextShift.shift_color }}
              >
                {data.nextShift.shift_code}
              </div>
              <div>
                <p className="font-semibold text-foreground">{data.nextShift.shift_name}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {format(parseISO(data.nextShift.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.nextShift.shift_start} – {data.nextShift.shift_end}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-8 text-muted-foreground text-sm text-center">
            Nenhum plantão próximo encontrado.
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/requests/leave/new">
          <Button variant="outline" className="w-full flex-col h-auto py-4 gap-2 hover:border-primary hover:text-primary">
            <ClipboardList className="w-5 h-5" />
            <span className="text-xs">Solicitar Folga</span>
          </Button>
        </Link>
        <Link href="/requests/swap/new">
          <Button variant="outline" className="w-full flex-col h-auto py-4 gap-2 hover:border-primary hover:text-primary">
            <RefreshCw className="w-5 h-5" />
            <span className="text-xs">Solicitar Troca</span>
          </Button>
        </Link>
      </div>

      {/* Links rápidos */}
      <div className="grid gap-2">
        <Link href="/schedule">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Ver escala completa</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/requests">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Minhas solicitações</span>
                {data.pendingRequests.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {data.pendingRequests.length}
                  </Badge>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/notifications">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Notificações</span>
                {data.unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">{data.unreadCount}</Badge>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
