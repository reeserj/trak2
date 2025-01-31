'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from URL
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (!session) {
          // If no session, try to exchange the code for a session
          const { error: signInError } = await supabase.auth.exchangeCodeForSession(window.location.search);
          if (signInError) {
            throw signInError;
          }
        }

        // Redirect to dashboard
        router.push('/dashboard');
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.push('/');
      }
    };

    // Run the callback handler
    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="animate-pulse text-center">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Completing sign in...</h2>
        <div className="w-16 h-16 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
} 