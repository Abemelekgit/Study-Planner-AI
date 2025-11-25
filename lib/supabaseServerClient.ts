import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  // We do not throw here to keep local dev flexible; endpoints should handle missing keys gracefully.
  console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY not set. Server-side plan saving will be disabled.');
}

export const serverSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});
