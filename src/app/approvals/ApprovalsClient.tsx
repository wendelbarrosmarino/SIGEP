'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, XCircle, Clock, Filter, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

type Status = 'PENDING' | 'APPROVED' | 'DENIED';

interface LeaveRequest {
  id: string;
  date: string;
  reason: string;
  status: Status;
  rt_comment?: string;
  created_at: string;
  user: { id: string; name: string; crm: string; phone: string };
}

interface SwapRequest {
  id: string;
  status: Status;
  target_accepted: boolean;
  rt_comment?: string;
  created_at: string;
  requester: { id: string; name: string; crm: string };
  target: { id: string; name: string; crm: string };
  requesterEntry: { date: string; shift: { name: string; code: string } };
  targetEntry: { date: string; shift: { name: string; code: string } };
}

interface ReviewDialogState {
  type: 'leave' | 'swap';
  id: string;
  action: 'APPROVED' | 'DENIED';
  name: string;
}

const STATUS_LABELS: Record<Status, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  DENIED: 'Negada',
};

const STATUS_STYLES: Record<Status, string> = {
  PENDING: 'status-pending',
  APPROVED: 'status-approved',
  DENIED: 'status-denied',
};

export function ApprovalsClient({ leaves, swaps }: { leaves: LeaveRequest[]; swaps: SwapRequest[] }) {
  const [filter, setFilter] = useState<Status | 'ALL'>('PENDING');
  const [dialog, setDialog] = useState<ReviewDialogState | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const filteredLeaves = filter === 'ALL' ? leaves : leaves.filter((l) => l.status === filter);
  const filteredSwaps = filter === 'ALL' ? swaps : swaps.filter((s) => s.status === filter);

  const pendingCount = {
    leaves: leaves.filter((l) => l.status === 'PENDING').length,
    swaps: swaps.filter((s) => s.status === 'PENDING').length,
  };

  const openReview = (type: 'leave' | 'swap', id: string, action: 'APPROVED' | 'DENIED', name: string) => {
    setDialog({ type, id, action, name });
    setComment('');
  };

  const submitReview = async () => {
    if (!dialog) return;
    if (dialog.action === 'DENIED' && comment.length < 10) {
      toast({ title: 'Justificativa obrigatória', description: 'Informe o motivo da negativa (mínimo 10 caracteres).', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = dialog.type === 'leave'
        ? `/api/requests/leave/${dialog.id}/review`
        : `/api/requests/swap/${dialog.id}/review`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: dialog.action, comment }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast({
        title: dialog.action === 'APPROVED' ? 'Aprovado com sucesso' : 'Negado com sucesso',
        description: `A solicitação de ${dialog.name} foi ${dialog.action === 'APPROVED' ? 'aprovada' : 'negada'}.`,
      });

      setDialog(null);
      router.refresh();
    } catch (err: unknown) {
      toast({ title: 'Erro', description: err instanceof Error ? err.message : 'Falha ao processar.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros de status */}
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'PENDING', 'APPROVED', 'DENIED'] as const).map((s) => (
          <Button
            key={s}
            variant={filter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s === 'ALL' ? 'Todas' : STATUS_LABELS[s as Status]}
            {s === 'PENDING' && pendingCount.leaves + pendingCount.swaps > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {pendingCount.leaves + pendingCount.swaps}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="leaves">
        <TabsList>
          <TabsTrigger value="leaves" className="gap-2">
            Folgas
            {pendingCount.leaves > 0 && <Badge variant="destructive" className="text-xs">{pendingCount.leaves}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="swaps" className="gap-2">
            Trocas
            {pendingCount.swaps > 0 && <Badge variant="destructive" className="text-xs">{pendingCount.swaps}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Folgas */}
        <TabsContent value="leaves" className="mt-4">
          <div className="space-y-3">
            {filteredLeaves.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                  Nenhuma solicitação de folga encontrada.
                </CardContent>
              </Card>
            )}
            {filteredLeaves.map((leave) => (
              <Card key={leave.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">{leave.user.name}</p>
                        <Badge className={`text-xs ${STATUS_STYLES[leave.status]}`}>
                          {STATUS_LABELS[leave.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">CRM: {leave.user.crm}</p>
                      <p className="text-sm text-muted-foreground">
                        Data: <strong>{format(parseISO(leave.date), "dd/MM/yyyy (EEEE)", { locale: ptBR })}</strong>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Motivo: {leave.reason}</p>
                      {leave.rt_comment && (
                        <p className="text-sm text-destructive mt-1">Justificativa: {leave.rt_comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Solicitado em {format(parseISO(leave.created_at), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>

                    {leave.status === 'PENDING' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => openReview('leave', leave.id, 'DENIED', leave.user.name)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Negar
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => openReview('leave', leave.id, 'APPROVED', leave.user.name)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trocas */}
        <TabsContent value="swaps" className="mt-4">
          <div className="space-y-3">
            {filteredSwaps.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                  Nenhuma solicitação de troca encontrada.
                </CardContent>
              </Card>
            )}
            {filteredSwaps.map((swap) => (
              <Card key={swap.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-xs ${STATUS_STYLES[swap.status]}`}>
                          {STATUS_LABELS[swap.status]}
                        </Badge>
                        {!swap.target_accepted && swap.status === 'PENDING' && (
                          <Badge variant="outline" className="text-xs">Aguardando aceite</Badge>
                        )}
                      </div>
                      <p className="text-sm">
                        <strong>{swap.requester.name}</strong> quer trocar{' '}
                        <strong>{swap.requesterEntry?.shift?.code} {format(parseISO(swap.requesterEntry?.date || ''), 'dd/MM')}</strong>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        com <strong>{swap.target.name}</strong>{' '}
                        ({swap.targetEntry?.shift?.code} {format(parseISO(swap.targetEntry?.date || ''), 'dd/MM')})
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Solicitado em {format(parseISO(swap.created_at), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>

                    {swap.status === 'PENDING' && swap.target_accepted && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => openReview('swap', swap.id, 'DENIED', swap.requester.name)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Negar
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => openReview('swap', swap.id, 'APPROVED', swap.requester.name)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de revisão */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.action === 'APPROVED' ? 'Aprovar solicitação' : 'Negar solicitação'}
            </DialogTitle>
            <DialogDescription>
              {dialog?.action === 'APPROVED'
                ? `Confirmar aprovação da solicitação de ${dialog?.name}?`
                : `Para negar, é obrigatório informar a justificativa. O funcionário receberá o motivo da negativa.`}
            </DialogDescription>
          </DialogHeader>

          {dialog?.action === 'DENIED' && (
            <div className="space-y-2">
              <Label htmlFor="comment">
                Justificativa <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="comment"
                placeholder="Informe o motivo da negativa (mínimo 10 caracteres)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className={comment.length > 0 && comment.length < 10 ? 'border-destructive' : ''}
              />
              {comment.length > 0 && comment.length < 10 && (
                <p className="text-xs text-destructive">Mínimo 10 caracteres ({comment.length}/10)</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              onClick={submitReview}
              disabled={isSubmitting || (dialog?.action === 'DENIED' && comment.length < 10)}
              className={dialog?.action === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={dialog?.action === 'DENIED' ? 'destructive' : 'default'}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</>
              ) : dialog?.action === 'APPROVED' ? (
                <><CheckCircle2 className="w-4 h-4 mr-2" />Confirmar aprovação</>
              ) : (
                <><XCircle className="w-4 h-4 mr-2" />Confirmar negativa</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
