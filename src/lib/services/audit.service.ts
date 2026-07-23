import { createAdminClient } from '@/lib/supabase/server';
import type { AuditAction, AuditLog } from '@/types';

interface LogParams {
  userId?: string;
  action: AuditAction;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export const auditService = {
  async log(params: LogParams): Promise<void> {
    const supabase = createAdminClient();
    await supabase.from('audit_logs').insert({
      user_id: params.userId || null,
      action: params.action,
      description: params.description,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      metadata: params.metadata || null,
    });
  },

  async getAll(params: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: AuditAction;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: AuditLog[]; total: number }> {
    const supabase = createAdminClient();
    const page = params.page || 1;
    const limit = params.limit || 50;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        user:users(id, name, login)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (params.userId) query = query.eq('user_id', params.userId);
    if (params.action) query = query.eq('action', params.action);
    if (params.startDate) query = query.gte('created_at', params.startDate);
    if (params.endDate) query = query.lte('created_at', params.endDate);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      data: (data || []).map((log) => ({
        id: log.id,
        userId: log.user_id,
        action: log.action,
        description: log.description,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        metadata: log.metadata,
        user: log.user,
        createdAt: log.created_at,
      })),
      total: count || 0,
    };
  },
};
