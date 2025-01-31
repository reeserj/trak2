'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Failed to get session');
          return;
        }

        if (!session) {
          // If no session, try to exchange the code for a session
          const { error: signInError } = await supabase.auth.exchangeCodeForSession(window.location.search);
          if (signInError) {
            console.error('Sign in error:', signInError);
            setError('Failed to sign in');
            return;
          }

          // Get the session again after exchange
          const { data: { session: newSession }, error: newSessionError } = await supabase.auth.getSession();
          if (newSessionError || !newSession) {
            console.error('New session error:', newSessionError);
            setError('Failed to get new session');
            return;
          }
        }

        // Redirect to dashboard
        router.push('/dashboard');
      } catch (error) {
        console.error('Error in auth callback:', error);
        setError('An unexpected error occurred');
      }
    };

    // Run the callback handler
    handleAuthCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-red-600 dark:text-red-400">Authentication Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-brand-blue text-white rounded hover:bg-blue-600 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="animate-pulse text-center">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Completing sign in...</h2>
        <div className="w-16 h-16 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
} 