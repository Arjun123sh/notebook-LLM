import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CONFIG } from './config';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  const { URL, ANON_KEY } = CONFIG.SUPABASE;

  if (!URL || !ANON_KEY || URL.includes('placeholder')) {
    console.warn("Supabase environment variables are missing or default.");
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
