import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const siteURL = process.env.NODE_ENV === 'production' 
  ? 'https://reeserj.github.io/trak2'
  : 'http://localhost:3000';

const redirectURL = `${siteURL}/auth/callback`;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'trak2-auth',
    debug: true
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
}); 

// Updated signup function with better error handling
export const signUpUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectURL,
        data: {
          timestamp: new Date().toISOString()
        }
      }
    });

    if (error) {
      console.error('Signup error:', error.message);
      return { data: null, error };
    }

    console.log('Signup successful:', data);
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error during signup:', err);
    return { data: null, error: err as Error };
  }
};

interface MagicLinkResponse {
  data: any | null;
  error: Error | null;
}

// Magic Link signin function
export const signInWithMagicLink = async (email: string): Promise<MagicLinkResponse> => {
  try {
    console.log('Attempting to sign in with email:', email);
    
    // First try to create a user with a random password
    const tempPassword = crypto.randomUUID();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        emailRedirectTo: redirectURL,
        data: {
          created_at: new Date().toISOString()
        }
      }
    });

    // If user already exists or was created successfully, send magic link
    if (!signUpError || signUpError.message.includes('already registered')) {
      console.log('Attempting to send magic link...');
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectURL
      });

      if (error) {
        console.error('Magic link error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          details: error
        });
        return { data: null, error };
      }

      console.log('Magic link sent successfully');
      return { data, error: null };
    } else {
      // If there was an error creating the user
      console.error('User creation error:', signUpError);
      return { data: null, error: signUpError };
    }
  } catch (err) {
    console.error('Unexpected error during magic link signin:', err);
    if (err instanceof Error) {
      return { 
        data: null, 
        error: {
          message: err.message,
          name: err.name,
          // @ts-ignore - adding stack for debugging
          stack: err.stack
        } as Error
      };
    }
    return { data: null, error: err as Error };
  }
};

// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  if (session) {
    console.log('Session:', session);
  }
}); 