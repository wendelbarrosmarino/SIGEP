import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('sigep_token')?.value;
    if (!token) return NextResponse.json({ success: true, data: { count: 0 } });
    
    const payload = authService.verifyToken(token);
    if (!payload) return NextResponse.json({ success: true, data: { count: 0 } });

    const supabase = createAdminClient();
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', payload.sub)
      .eq('is_read', false);

    return NextResponse.json({ success: true, data: { count: count || 0 } });
  } catch {
    return NextResponse.json({ success: true, data: { count: 0 } });
  }
}
