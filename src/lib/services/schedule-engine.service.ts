/**
 * SIGEP — Motor de Geração de Escalas
 *
 * Algoritmo inteligente que distribui profissionais nos turnos
 * respeitando todas as regras de negócio do HUERB.
 */

import { createAdminClient } from '@/lib/supabase/server';
import type {
  ScheduleConflict,
  ScheduleGenerationConfig,
  User,
  Shift,
} from '@/types';
import { getDaysInMonth, format, parseISO, addDays } from 'date-fns';

interface GenerationResult {
  success: boolean;
  entries: Array<{ userId: string; shiftId: string; date: string }>;
  conflicts: ScheduleConflict[];
  scheduleId: string;
}

export const scheduleEngineService = {
  /**
   * Gera a escala para o mês/ano configurado
   */
  async generateSchedule(config: ScheduleGenerationConfig): Promise<GenerationResult> {
    const supabase = createAdminClient();
    const conflicts: ScheduleConflict[] = [];

    // 1. Buscar dados necessários
    const [employees, shifts, approvedLeaves] = await Promise.all([
      this.getActiveEmployees(config.employeeIds),
      this.getActiveShifts(config.shiftIds),
      this.getApprovedLeaves(config.month, config.year),
    ]);

    const daysInMonth = getDaysInMonth(new Date(config.year, config.month - 1));
    const entries: Array<{ userId: string; shiftId: string; date: string }> = [];

    // 2. Mapa de folgas aprovadas (data -> userId[])
    const leaveMap = new Map<string, Set<string>>();
    for (const leave of approvedLeaves) {
      if (!leaveMap.has(leave.date)) leaveMap.set(leave.date, new Set());
      leaveMap.get(leave.date)!.add(leave.user_id);
    }

    // 3. Contador de plantões por funcionário (para balanceamento)
    const employeeShiftCount = new Map<string, number>();
    employees.forEach((e) => employeeShiftCount.set(e.id, 0));

    // 4. Iterar por dia e turno
    for (let day = 1; day <= daysInMonth; day++) {
      const date = format(new Date(config.year, config.month - 1, day), 'yyyy-MM-dd');

      for (const shift of shifts) {
        // Funcionários disponíveis para este dia/turno
        const available = employees.filter((emp) => {
          if (config.respectLeaveRequests && leaveMap.get(date)?.has(emp.id)) return false;
          // Verificar se já tem plantão neste dia
          const alreadyAssigned = entries.some(
            (e) => e.date === date && e.userId === emp.id
          );
          return !alreadyAssigned;
        });

        // Ordenar por menor número de plantões (balanceamento)
        available.sort(
          (a, b) =>
            (employeeShiftCount.get(a.id) || 0) - (employeeShiftCount.get(b.id) || 0)
        );

        const assigned = available.slice(0, shift.maxStaff);

        if (assigned.length < shift.minStaff) {
          conflicts.push({
            type: 'MISSING_STAFF',
            date,
            shiftId: shift.id,
            message: `${shift.name} em ${date}: mínimo ${shift.minStaff} profissional(is), disponível(is) ${assigned.length}`,
            severity: 'ERROR',
          });
        }

        for (const emp of assigned) {
          entries.push({ userId: emp.id, shiftId: shift.id, date });
          employeeShiftCount.set(emp.id, (employeeShiftCount.get(emp.id) || 0) + 1);
        }
      }
    }

    // 5. Persistir no banco
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .upsert({ month: config.month, year: config.year, is_published: false })
      .select()
      .single();

    if (scheduleError || !schedule) throw new Error('Erro ao criar escala');

    // Limpar entradas anteriores
    await supabase.from('schedule_entries').delete().eq('schedule_id', schedule.id);

    // Inserir novas entradas em lotes de 100
    const BATCH_SIZE = 100;
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE).map((e) => ({
        schedule_id: schedule.id,
        user_id: e.userId,
        shift_id: e.shiftId,
        date: e.date,
      }));
      await supabase.from('schedule_entries').insert(batch);
    }

    return { success: conflicts.filter((c) => c.severity === 'ERROR').length === 0, entries, conflicts, scheduleId: schedule.id };
  },

  /**
   * Valida escala antes da publicação
   */
  async validateSchedule(scheduleId: string): Promise<ScheduleConflict[]> {
    const supabase = createAdminClient();
    const conflicts: ScheduleConflict[] = [];

    const { data: entries } = await supabase
      .from('schedule_entries')
      .select(`*, shift:shifts(*), user:users(*)`)
      .eq('schedule_id', scheduleId);

    if (!entries) return conflicts;

    // Agrupar por data+turno
    const byDateShift = new Map<string, typeof entries>();
    for (const entry of entries) {
      const key = `${entry.date}::${entry.shift_id}`;
      if (!byDateShift.has(key)) byDateShift.set(key, []);
      byDateShift.get(key)!.push(entry);
    }

    for (const [key, dayEntries] of byDateShift) {
      const [date] = key.split('::');
      const shift = dayEntries[0].shift;

      // Verificar quantidade mínima
      if (dayEntries.length < shift.min_staff) {
        conflicts.push({
          type: 'MISSING_STAFF',
          date,
          shiftId: shift.id,
          message: `${shift.name} em ${date}: apenas ${dayEntries.length}/${shift.min_staff} profissional(is)`,
          severity: 'ERROR',
        });
      }

      // Verificar quantidade máxima
      if (dayEntries.length > shift.max_staff) {
        conflicts.push({
          type: 'EXCESS_STAFF',
          date,
          shiftId: shift.id,
          message: `${shift.name} em ${date}: ${dayEntries.length} profissional(is), máximo ${shift.max_staff}`,
          severity: 'WARNING',
        });
      }

      // Verificar duplicidade
      const userIds = dayEntries.map((e) => e.user_id);
      const uniqueIds = new Set(userIds);
      if (uniqueIds.size !== userIds.length) {
        conflicts.push({
          type: 'DUPLICATE',
          date,
          shiftId: shift.id,
          message: `${shift.name} em ${date}: profissional duplicado`,
          severity: 'ERROR',
        });
      }
    }

    // Verificar solicitações pendentes que afetam datas da escala
    const { data: pendingLeaves } = await supabase
      .from('leave_requests')
      .select('date, user:users(name)')
      .eq('status', 'PENDING');

    if (pendingLeaves) {
      for (const leave of pendingLeaves) {
        const affected = entries.filter((e) => e.date === leave.date);
        if (affected.length > 0) {
          conflicts.push({
            type: 'PENDING_REQUEST',
            date: leave.date,
            message: `Solicitação de folga pendente em ${leave.date}`,
            severity: 'WARNING',
          });
        }
      }
    }

    return conflicts;
  },

  async getActiveEmployees(ids: string[]): Promise<User[]> {
    const supabase = createAdminClient();
    let query = supabase.from('users').select('*').eq('is_active', true).eq('role', 'EMPLOYEE');
    if (ids.length > 0) query = query.in('id', ids);
    const { data } = await query;
    return (data || []).map((u) => ({
      id: u.id,
      name: u.name,
      crm: u.crm,
      phone: u.phone,
      login: u.login,
      role: u.role,
      isFirstAccess: u.is_first_access,
      isActive: u.is_active,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }));
  },

  async getActiveShifts(ids: string[]): Promise<Shift[]> {
    const supabase = createAdminClient();
    let query = supabase.from('shifts').select('*').eq('is_active', true);
    if (ids.length > 0) query = query.in('id', ids);
    const { data } = await query;
    return (data || []).map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      startTime: s.start_time,
      endTime: s.end_time,
      minStaff: s.min_staff,
      maxStaff: s.max_staff,
      color: s.color,
      isActive: s.is_active,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));
  },

  async getApprovedLeaves(month: number, year: number): Promise<Array<{ date: string; user_id: string }>> {
    const supabase = createAdminClient();
    const startDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
    const endDate = format(new Date(year, month, 0), 'yyyy-MM-dd');

    const { data } = await supabase
      .from('leave_requests')
      .select('date, user_id')
      .eq('status', 'APPROVED')
      .gte('date', startDate)
      .lte('date', endDate);

    return data || [];
  },
};
