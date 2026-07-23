'use client';

import { useState, useEffect } from 'react';
import { Bell, Moon, Sun, Menu, User, LogOut, Settings, Lock, ChevronLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const [unread, setUnread] = useState(0);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const isDashboard = pathname === '/dashboard';

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setUser(d.data));
    fetch('/api/notifications/unread-count').then((r) => r.json()).then((d) => setUnread(d.data?.count || 0));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth/login';
  };

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur flex items-center px-4 gap-3 no-print sticky top-0 z-40">
      {/* Botão voltar — aparece em todas as páginas exceto dashboard */}
      {!isDashboard ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">Voltar</span>
        </Button>
      ) : (
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => {}}>
          <Menu className="w-5 h-5" />
        </Button>
      )}

      {/* Título */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground truncate hidden sm:block">
          Hospital de Urgência e Emergência de Rio Branco
        </p>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1">
        {/* Tema */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Alternar tema"
        >
          <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notificações */}
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            )}
          </Button>
        </Link>

        {/* Usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-3">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="hidden sm:flex flex-col items-start text-xs">
                <span className="font-medium leading-none">{user?.name?.split(' ')[0] || 'Usuário'}</span>
                <span className="text-muted-foreground leading-none mt-0.5">{user?.role === 'RT' ? 'Resp. Técnico' : 'Funcionário'}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Meu perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile/change-password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Alterar senha
              </Link>
            </DropdownMenuItem>
            {user?.role === 'RT' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
