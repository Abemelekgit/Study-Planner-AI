import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase } from '@/lib/supabaseServerClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, title, plan } = body || {};

    if (!serverSupabase) {
      return NextResponse.json({ error: 'Server Supabase client not configured' }, { status: 501 });
    }

    if (!user_id || !plan) {
      return NextResponse.json({ error: 'Missing required fields: user_id and plan' }, { status: 400 });
    }

    // Insert into `plans` table. Expect a table with columns: id (uuid), user_id (text), title (text), plan_json (jsonb), created_at (timestamp)
    const insertBody = {
      user_id,
      title: title || 'Untitled Plan',
      plan_json: plan,
    } as any;

    const { data, error } = await serverSupabase.from('plans').insert(insertBody).select().limit(1).single();

    if (error) {
      console.error('[SavePlan] Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save plan to database' }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan: data });
  } catch (err) {
    console.error('[SavePlan] error:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
