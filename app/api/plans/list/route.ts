import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/supabaseServerClient';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get('user_id');

    if (!serverSupabase) {
      return NextResponse.json({ error: 'Server Supabase client not configured' }, { status: 501 });
    }

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id query parameter' }, { status: 400 });
    }

    const { data, error } = await serverSupabase.from('plans').select('id, title, created_at').eq('user_id', user_id).order('created_at', { ascending: false });
    if (error) {
      console.error('[ListPlans] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }

    return NextResponse.json({ plans: data });
  } catch (err) {
    console.error('[ListPlans] error:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
