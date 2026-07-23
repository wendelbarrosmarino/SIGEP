'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, Hospital, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const loginSchema = z.object({
  login: z.string().min(1, 'Informe seu login'),
  password: z.string().min(1, 'Informe sua senha'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast({ title: 'Acesso negado', description: result.error || 'Login ou senha incorretos', variant: 'destructive' });
        return;
      }

      if (result.data.isFirstAccess) {
        router.push('/auth/first-access');
      } else {
        router.push('/dashboard');
      }
    } catch {
      toast({ title: 'Erro', description: 'Falha na conexão. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Painel esquerdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0078D4] to-[#005A9E] flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        </div>
        <div className="relative z-10 text-center">
          <img src="/logo.png" alt="HUERB" className="h-36 w-auto object-contain mb-6 mx-auto drop-shadow-lg" />
          <h1 className="text-4xl font-bold tracking-tight mb-2">SIGEP</h1>
          <p className="text-xl text-blue-100 font-medium mb-6">
            Sistema Inteligente de Gestão<br />de Escalas de Plantão
          </p>
          <div className="h-px bg-white/20 mb-6" />
          <p className="text-blue-200 text-sm">
            {process.env.NEXT_PUBLIC_HOSPITAL_NAME || 'HUERB'}
          </p>
          <p className="text-blue-300 text-xs mt-1">
            {process.env.NEXT_PUBLIC_HOSPITAL_SUBTITLE || 'Hospital de Urgência e Emergência de Rio Branco'}
          </p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Header mobile */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <img src="/logo.png" alt="HUERB" className="h-10 w-auto object-contain" />
          <div>
            <h1 className="text-xl font-bold text-foreground">SIGEP</h1>
            <p className="text-xs text-muted-foreground">Gestão de Escalas</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground">Bem-vindo de volta</h2>
            <p className="text-muted-foreground mt-1">Acesse sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login">Login</Label>
              <Input
                id="login"
                placeholder="Seu login de acesso"
                autoComplete="username"
                disabled={isLoading}
                {...register('login')}
                className={errors.login ? 'border-destructive' : ''}
              />
              {errors.login && (
                <p className="text-xs text-destructive">{errors.login.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...register('password')}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Entrando...</>
              ) : (
                <><LogIn className="w-4 h-4 mr-2" />Entrar</>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Não tem acesso? Fale com o Responsável Técnico.
          </p>
        </div>
      </div>
    </div>
  );
}
