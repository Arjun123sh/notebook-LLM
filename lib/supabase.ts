import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CONFIG } from './config';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  const { URL, ANON_KEY } = CONFIG.SUPABASE;

  if (!URL || URL.includes('placeholder')) {
    console.error("CRITICAL: NEXT_PUBLIC_SUPABASE_URL is missing or invalid in this environment.");
  }
  if (!ANON_KEY || ANON_KEY.includes('placeholder')) {
    console.error("CRITICAL: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or invalid in this environment.");
  }

  supabaseInstance = createClient(URL, ANON_KEY);
  return supabaseInstance;
};

export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabase();
    return (client as any)[prop];
  }
});
