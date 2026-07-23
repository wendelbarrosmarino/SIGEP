import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/server';
import type { NotificationType } from '@/types';

if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@hospital.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface NotifyParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export const notificationService = {
  /**
   * Cria notificação no banco e envia push
   */
  async notify(params: NotifyParams): Promise<void> {
    const supabase = createAdminClient();

    // Salvar no banco
    await supabase.from('notifications').insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data || null,
    });

    // Enviar push notification
    await this.sendPush(params.userId, params.title, params.message);
  },

  /**
   * Notifica todos os RTs
   */
  async notifyRTs(type: NotificationType, title: string, message: string, data?: Record<string, unknown>): Promise<void> {
    const supabase = createAdminClient();
    const { data: rts } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'RT')
      .eq('is_active', true);

    if (!rts) return;
    await Promise.all(rts.map((rt) => this.notify({ userId: rt.id, type, title, message, data })));
  },

  /**
   * Envia web push
   */
  async sendPush(userId: string, title: string, body: string): Promise<void> {
    const supabase = createAdminClient();
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (!subs || subs.length === 0) return;

    const payload = JSON.stringify({ title, body, icon: '/icons/icon-192x192.png' });

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
        } catch {
          // Remover subscription inválida
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      })
    );
  },

  /**
   * Envia WhatsApp via CallMeBot (gratuito)
   */
  async sendWhatsApp(phone: string, message: string): Promise<void> {
    if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_KEY) return;

    const cleanPhone = phone.replace(/\D/g, '');
    const url = `${process.env.WHATSAPP_API_URL}?phone=${cleanPhone}&text=${encodeURIComponent(message)}&apikey=${process.env.WHATSAPP_API_KEY}`;

    try {
      await fetch(url);
    } catch {
      // Log silencioso — WhatsApp é opcional
    }
  },

  /**
   * Marca notificações como lidas
   */
  async markAsRead(userId: string, notificationIds?: string[]): Promise<void> {
    const supabase = createAdminClient();
    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);

    if (notificationIds?.length) {
      query = query.in('id', notificationIds);
    }

    await query;
  },

  /**
   * Busca notificações do usuário
   */
  async getForUser(userId: string, limit = 30) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  },

  /**
   * Conta não lidas
   */
  async countUnread(userId: string): Promise<number> {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return count || 0;
  },
};
