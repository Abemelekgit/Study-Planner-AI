import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  // We do not throw here to keep local dev flexible; endpoints should handle missing keys gracefully.
  console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY not set. Server-side plan saving will be disabled.');
}

// Only create the server-side Supabase client when a service key is present.
export const serverSupabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null as any;
