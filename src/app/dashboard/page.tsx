import { headers } from 'next/headers';
import { RTDashboard } from '@/components/dashboard/RTDashboard';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import { createAdminClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

async function getDashboardData(userId: string, role: string) {
  const supabase = createAdminClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  if (role === 'RT') {
    const [todayShifts, pendingLeaves, pendingSwaps, employees, recentLogs] = await Promise.all([
      supabase
        .from('schedule_entries_detailed')
        .select('*')
        .eq('date', today)
        .order('shift_start'),
      supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING'),
      supabase
        .from('swap_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING'),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('role', 'EMPLOYEE'),
      supabase
        .from('audit_logs')
        .select('*, user:users(name)')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    return {
      type: 'RT' as const,
      todayShifts: todayShifts.data || [],
      pendingLeaves: pendingLeaves.count || 0,
      pendingSwaps: pendingSwaps.count || 0,
      totalEmployees: employees.count || 0,
      recentLogs: recentLogs.data || [],
    };
  } else {
    const [nextShift, myShiftsCount, pendingRequests, unread] = await Promise.all([
      supabase
        .from('schedule_entries_detailed')
        .select('*')
        .eq('user_id', userId)
        .gte('date', today)
        .order('date')
        .limit(1),
      supabase
        .from('schedule_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`),
      supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'PENDING'),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false),
    ]);

    return {
      type: 'EMPLOYEE' as const,
      nextShift: nextShift.data?.[0] || null,
      monthShiftsCount: myShiftsCount.count || 0,
      pendingRequests: pendingRequests.data || [],
      unreadCount: unread.count || 0,
    };
  }
}

export default async function DashboardPage() {
  const headersList = headers();
  const userId = headersList.get('x-user-id') || '';
  const role = headersList.get('x-user-role') || 'EMPLOYEE';

  const data = await getDashboardData(userId, role);

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {data.type === 'RT' ? (
        <RTDashboard data={data} />
      ) : (
        <EmployeeDashboard data={data} />
      )}
    </div>
  );
}
