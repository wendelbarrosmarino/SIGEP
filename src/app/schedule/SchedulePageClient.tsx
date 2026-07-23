'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, SendHorizonal, RefreshCw, AlertTriangle, CheckCircle2, Loader2, ChevronLeft } from 'lucide-react';
import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

interface Props {
  entries: Array<{
    id: string;
    date: string;
    user_id: string;
    user_name: string;
    user_crm: string;
    user_phone: string;
    shift_id: string;
    shift_name: string;
    shift_code: string;
    shift_color: string;
    shift_start: string;
    shift_end: string;
  }>;
  shifts: Array<{ id: string; name: string; code: string; color: string }>;
  schedule: { id: string; is_published: boolean; published_at?: string } | null;
  month: number;
  year: number;
  currentUserId: string;
  isRT: boolean;
}

export function SchedulePageClient({ entries, shifts, schedule, month, year, currentUserId, isRT }: Props) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [conflicts, setConflicts] = useState<Array<{ message: string; severity: string }>>([]);
  const [showConflicts, setShowConflicts] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleMonthChange = (newMonth: number, newYear: number) => {
    router.push(`/schedule?month=${newMonth}&year=${newYear}`);
  };

  const handlePublish = async () => {
    if (!schedule?.id) return;
    setIsPublishing(true);
    try {
      // Primeiro validar
      const validateRes = await fetch(`/api/schedule/${schedule.id}/validate`);
      const validateData = await validateRes.json();

      const errors = (validateData.data || []).filter((c: { severity: string }) => c.severity === 'ERROR');
      if (errors.length > 0) {
        setConflicts(validateData.data);
        setShowConflicts(true);
        toast({ title: 'Conflitos encontrados', description: `${errors.length} erro(s) impedem a publicação.`, variant: 'destructive' });
        return;
      }

      const res = await fetch(`/api/schedule/${schedule.id}/publish`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao publicar');

      toast({ title: 'Escala publicada!', description: 'Todos os funcionários foram notificados.' });
      router.refresh();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível publicar a escala.', variant: 'destructive' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!schedule?.id) return;
    setIsUnpublishing(true);
    try {
      const res = await fetch(`/api/schedule/${schedule.id}/unpublish`, { method: 'POST' });
      if (!res.ok) throw new Error();
      toast({ title: 'Publicação cancelada', description: 'A escala voltou para rascunho.' });
      router.refresh();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível cancelar a publicação.', variant: 'destructive' });
    } finally {
      setIsUnpublishing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Menu Principal
          </button>
          <h1 className="text-2xl font-semibold">Escala de Plantão</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ambulatório — {process.env.NEXT_PUBLIC_HOSPITAL_NAME || 'HUERB'}</p>
        </div>

        {isRT && schedule && (
          <div className="flex items-center gap-2">
            {!schedule.is_published ? (
              <Button onClick={handlePublish} disabled={isPublishing} className="gap-2">
                {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publicar Escala
              </Button>
            ) : (
              <Button variant="outline" onClick={handleUnpublish} disabled={isUnpublishing} className="gap-2">
                {isUnpublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Cancelar Publicação
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Alerta de conflitos */}
      {showConflicts && conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Conflitos encontrados — publicação bloqueada</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {conflicts.map((c, i) => (
                <li key={i} className={`text-sm ${c.severity === 'ERROR' ? 'text-destructive-foreground' : 'text-yellow-200'}`}>
                  • {c.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Calendário */}
      {!schedule && !isRT && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="font-medium text-foreground">Escala não publicada</p>
            <p className="text-sm text-muted-foreground mt-1">
              A escala deste mês ainda não foi publicada pelo Responsável Técnico.
            </p>
          </CardContent>
        </Card>
      )}

      {(schedule || isRT) && (
        <Card>
          <CardContent className="p-4">
            <ScheduleCalendar
              entries={entries}
              shifts={shifts}
              currentUserId={currentUserId}
              month={month}
              year={year}
              isPublished={schedule?.is_published || false}
              isRT={isRT}
              onMonthChange={handleMonthChange}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
