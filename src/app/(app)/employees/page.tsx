import { createAdminClient } from '@/lib/supabase/server';
import { EmployeesClient } from './EmployeesClient';

async function getEmployees() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('users')
    .select('id, name, crm, phone, login, role, is_active, is_first_access, created_at')
    .eq('role', 'EMPLOYEE')
    .order('name');
  return data || [];
}

export default async function EmployeesPage() {
  const employees = await getEmployees();
  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Funcionários</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie o cadastro da equipe</p>
      </div>
      <EmployeesClient initialEmployees={employees} />
    </div>
  );
}
