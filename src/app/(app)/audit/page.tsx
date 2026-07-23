import { createAdminClient } from '@/lib/supabase/server';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

async function getAuditLogs() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('audit_logs')
    .select(`*, user:users(name, login)`)
    .order('created_at', { ascending: false })
    .limit(200);
  return data || [];
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  LOGOUT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  EMPLOYEE_CREATED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  EMPLOYEE_UPDATED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  EMPLOYEE_DELETED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SCHEDULE_PUBLISHED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  REQUEST_APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REQUEST_DENIED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SWAP_APPROVED: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  SWAP_DENIED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  PASSWORD_CHANGED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

export default async function AuditPage() {
  const logs = await getAuditLogs();

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Auditoria</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Histórico imutável de todas as ações do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {logs.length} registro(s) — últimas ações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 px-6 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs font-normal ${ACTION_COLORS[log.action] || 'bg-muted text-muted-foreground'}`}>
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-sm text-foreground truncate">{log.description}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {log.user?.name || 'Sistema'} ({log.user?.login || 'system'})
                    </span>
                    {log.ip_address && (
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        IP: {log.ip_address}
                      </span>
                    )}
                  </div>
                </div>
                <time className="text-xs text-muted-foreground flex-shrink-0 text-right">
                  {format(parseISO(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                </time>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Nenhum registro de auditoria encontrado.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
