'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  CheckSquare,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  Hospital,
  LogOut,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  rtOnly?: boolean;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/schedule', label: 'Escala', icon: Calendar },
  { href: '/employees', label: 'Funcionários', icon: Users, rtOnly: true },
  { href: '/shifts', label: 'Turnos', icon: Clock, rtOnly: true },
  { href: '/approvals', label: 'Aprovações', icon: CheckSquare, rtOnly: true },
  { href: '/requests', label: 'Minhas Solicitações', icon: ClipboardList },
  { href: '/notifications', label: 'Notificações', icon: Bell },
  { href: '/audit', label: 'Auditoria', icon: ClipboardList, rtOnly: true },
  { href: '/settings', label: 'Configurações', icon: Settings, rtOnly: true },
];

interface SidebarProps {
  role: 'RT' | 'EMPLOYEE';
  unreadCount?: number;
}

export function Sidebar({ role, unreadCount = 0 }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const filteredItems = navItems.filter((item) => !item.rtOnly || role === 'RT');

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth/login';
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'sidebar relative hidden md:flex no-print transition-all duration-300',
          collapsed && 'collapsed'
        )}
        style={{ width: collapsed ? '64px' : '260px' }}
      >
        {/* Logo */}
        <div className={cn('flex items-center gap-3 px-4 py-4 border-b border-border', collapsed && 'justify-center px-2')}>
          <img
            src="/logo.png"
            alt="HUERB"
            className={cn('object-contain flex-shrink-0', collapsed ? 'h-8 w-8' : 'h-10 w-auto')}
          />
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm leading-none text-foreground">SIGEP</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">Gestão de Escalas</p>
            </div>
          )}
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && item.label === 'Notificações' && unreadCount > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        {/* Rodapé */}
        <div className="border-t border-border p-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-center">
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          )}
        </div>

        {/* Botão colapsar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-accent transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </TooltipProvider>
  );
}
