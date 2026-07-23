import { createAdminClient } from '@/lib/supabase/server';
import { ApprovalsClient } from './ApprovalsClient';

async function getApprovals() {
  const supabase = createAdminClient();

  const [leaves, swaps] = await Promise.all([
    supabase
      .from('leave_requests')
      .select(`*, user:users(id, name, crm, phone)`)
      .order('created_at', { ascending: false }),
    supabase
      .from('swap_requests')
      .select(`
        *,
        requester:users!requester_id(id, name, crm),
        target:users!target_id(id, name, crm),
        requesterEntry:schedule_entries!requester_entry_id(date, shift:shifts(name, code)),
        targetEntry:schedule_entries!target_entry_id(date, shift:shifts(name, code))
      `)
      .order('created_at', { ascending: false }),
  ]);

  return { leaves: leaves.data || [], swaps: swaps.data || [] };
}

export default async function ApprovalsPage() {
  const data = await getApprovals();

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Central de Aprovações</h1>
        <p className="text-muted-foreground text-sm mt-1">Analise e responda às solicitações dos funcionários</p>
      </div>
      <ApprovalsClient leaves={data.leaves} swaps={data.swaps} />
    </div>
  );
}
