'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Search, Edit2, Trash2, ShieldCheck, Loader2, Phone, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface Employee {
  id: string;
  name: string;
  crm: string;
  phone: string;
  login: string;
  is_active: boolean;
  is_first_access: boolean;
  created_at: string;
}

const createSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  crm: z.string().min(1, 'CRM obrigatório'),
  phone: z.string().min(10, 'Telefone inválido'),
  login: z.string().min(3, 'Login muito curto'),
  initialPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['EMPLOYEE', 'RT']).default('EMPLOYEE'),
});

type CreateForm = z.infer<typeof createSchema>;

export function EmployeesClient({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'EMPLOYEE' },
  });

  const filtered = useMemo(() => {
    if (!search) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.crm.toLowerCase().includes(q) ||
        e.phone.includes(q)
    );
  }, [employees, search]);

  const onCreate = async (data: CreateForm) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setEmployees((prev) => [...prev, result.data].sort((a, b) => a.name.localeCompare(b.name)));
      setShowCreate(false);
      reset();
      toast({ title: 'Funcionário cadastrado!', description: `${data.name} foi adicionado ao sistema.` });
    } catch (err: unknown) {
      toast({ title: 'Erro', description: err instanceof Error ? err.message : 'Falha ao cadastrar.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    setIsLoading(true);
    try {
      await fetch(`/api/employees/${deleteTarget.id}`, { method: 'DELETE' });
      setEmployees((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      toast({ title: 'Funcionário desativado', description: `${deleteTarget.name} foi desativado.` });
      setDeleteTarget(null);
    } catch {
      toast({ title: 'Erro', description: 'Falha ao desativar.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Barra de ações */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CRM ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Funcionário</span>
          </Button>
        </div>

        {/* Contador */}
        <p className="text-sm text-muted-foreground">{filtered.length} funcionário(s) encontrado(s)</p>

        {/* Lista */}
        <div className="grid gap-3">
          {filtered.map((emp) => (
            <Card key={emp.id} className={!emp.is_active ? 'opacity-60' : ''}>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {emp.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors">
                            {emp.name}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p className="font-semibold">{emp.name}</p>
                            <p>CRM: {emp.crm}</p>
                            <p>Tel: {emp.phone}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      {emp.is_first_access && (
                        <Badge variant="outline" className="text-xs">Aguardando 1º acesso</Badge>
                      )}
                      {!emp.is_active && (
                        <Badge variant="secondary" className="text-xs">Inativo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CreditCard className="w-3 h-3" />{emp.crm}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />{emp.phone}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>
                  {emp.is_active && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(emp)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Desativar</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                <ShieldCheck className="w-10 h-10 mb-3 opacity-40" />
                <p className="font-medium">Nenhum funcionário encontrado</p>
                <p className="text-sm">Tente uma busca diferente ou cadastre um novo funcionário.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dialog: Criar funcionário */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Funcionário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Nome completo *</Label>
                  <Input placeholder="Nome completo" {...register('name')} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>CRM *</Label>
                  <Input placeholder="CRM-00000" {...register('crm')} />
                  {errors.crm && <p className="text-xs text-destructive">{errors.crm.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>WhatsApp *</Label>
                  <Input placeholder="(68) 99999-0000" {...register('phone')} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Login *</Label>
                  <Input placeholder="usuario.login" {...register('login')} />
                  {errors.login && <p className="text-xs text-destructive">{errors.login.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Senha inicial *</Label>
                  <Input type="password" placeholder="Mínimo 6 chars" {...register('initialPassword')} />
                  {errors.initialPassword && <p className="text-xs text-destructive">{errors.initialPassword.message}</p>}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Cadastrar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog: Confirmar desativação */}
        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desativar funcionário?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget?.name} será desativado e não poderá mais acessar o sistema. Os registros históricos serão mantidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Desativar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
