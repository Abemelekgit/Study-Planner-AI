import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/supabaseServerClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, user_id } = body || {};

    if (!serverSupabase) {
      return NextResponse.json({ error: 'Server Supabase client not configured' }, { status: 501 });
    }

    if (!planId || !user_id) {
      return NextResponse.json({ error: 'Missing planId or user_id' }, { status: 400 });
    }

    const { error } = await serverSupabase.from('plans').delete().match({ id: planId, user_id });
    if (error) {
      console.error('[DeletePlan] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DeletePlan] error:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
