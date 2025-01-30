import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const siteURL = process.env.NODE_ENV === 'production' 
  ? 'https://reeserj.github.io/trak2'
  : 'http://localhost:3000';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'trak2-auth',
    debug: process.env.NODE_ENV === 'development'
  },
  global: {
    fetch: (...args) => fetch(...args),
  },
}); 