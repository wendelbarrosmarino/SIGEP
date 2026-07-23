import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/server';
import { SchedulePageClient } from './SchedulePageClient';

async function getScheduleData(month: number, year: number, userId: string, isRT: boolean) {
  const supabase = createAdminClient();

  const [schedule, shifts] = await Promise.all([
    supabase
      .from('schedules')
      .select('id, is_published, published_at')
      .eq('month', month)
      .eq('year', year)
      .maybeSingle(),
    supabase.from('shifts').select('*').eq('is_active', true).order('start_time'),
  ]);

  if (!schedule.data) {
    return { entries: [], shifts: shifts.data || [], schedule: null };
  }

  // Funcionários veem apenas escala publicada
  if (!isRT && !schedule.data.is_published) {
    return { entries: [], shifts: shifts.data || [], schedule: null };
  }

  const entries = await supabase
    .from('schedule_entries_detailed')
    .select('*')
    .eq('schedule_id', schedule.data.id)
    .order('date,shift_start');

  return {
    entries: entries.data || [],
    shifts: shifts.data || [],
    schedule: schedule.data,
  };
}

interface SearchParams {
  month?: string;
  year?: string;
}

export default async function SchedulePage({ searchParams }: { searchParams: SearchParams }) {
  const headersList = headers();
  const userId = headersList.get('x-user-id') || '';
  const role = headersList.get('x-user-role') || 'EMPLOYEE';
  const isRT = role === 'RT';

  const now = new Date();
  const month = parseInt(searchParams.month || String(now.getMonth() + 1));
  const year = parseInt(searchParams.year || String(now.getFullYear()));

  const data = await getScheduleData(month, year, userId, isRT);

  return (
    <div className="fade-in">
      <SchedulePageClient
        {...data}
        month={month}
        year={year}
        currentUserId={userId}
        isRT={isRT}
      />
    </div>
  );
}
