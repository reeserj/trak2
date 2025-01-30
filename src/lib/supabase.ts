import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const siteURL = process.env.NODE_ENV === 'production' 
  ? 'https://reeserj.github.io/trak2'
  : 'http://localhost:3000';

const redirectURL = process.env.NODE_ENV === 'production'
  ? 'https://reeserj.github.io/trak2/auth/callback'
  : `${siteURL}/auth/callback`;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'trak2-auth',
    debug: false
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
}); 

// Example signup function with proper redirect handling
export const signUpUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectURL
    }
  });
  return { data, error };
};

// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  if (session) {
    console.log('Session:', session);
  }
}); 