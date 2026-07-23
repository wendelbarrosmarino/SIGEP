'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'Pelo menos um número')
      .regex(/[^A-Za-z0-9]/, 'Pelo menos um caractere especial'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

const requirements = [
  { test: (p: string) => p.length >= 8, label: 'Mínimo 8 caracteres' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Letra maiúscula' },
  { test: (p: string) => /[0-9]/.test(p), label: 'Número' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'Caractere especial' },
];

export default function FirstAccessPage() {
  const [showPw, setShowPw] = useState(false);
  const [showCo, setShowCo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const watchedPassword = watch('password', '');

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: data.password }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({ title: 'Erro', description: err.error, variant: 'destructive' });
        return;
      }

      toast({ title: 'Senha criada com sucesso!', description: 'Bem-vindo ao SIGEP.' });
      router.push('/dashboard');
    } catch {
      toast({ title: 'Erro', description: 'Falha na conexão.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md bg-card rounded-2xl border shadow-lg p-8">
        <div className="flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-6 mx-auto">
          <ShieldCheck className="w-7 h-7 text-primary" />
        </div>

        <h1 className="text-2xl font-semibold text-center mb-1">Primeiro acesso</h1>
        <p className="text-muted-foreground text-center text-sm mb-8">
          Por segurança, crie uma nova senha para sua conta.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                disabled={isLoading}
                {...register('password')}
                className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {/* Indicador de força */}
          {watchedPassword && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Requisitos:</p>
              <div className="grid grid-cols-2 gap-1">
                {requirements.map((req) => {
                  const ok = req.test(watchedPassword);
                  return (
                    <div key={req.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                      {req.label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showCo ? 'text' : 'password'}
                placeholder="Repita a nova senha"
                disabled={isLoading}
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
              />
              <button type="button" onClick={() => setShowCo(!showCo)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showCo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" className="w-full mt-2" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
            ) : (
              <><Lock className="w-4 h-4 mr-2" />Criar senha e entrar</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
