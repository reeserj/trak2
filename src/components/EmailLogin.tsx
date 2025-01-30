'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthError } from '@supabase/supabase-js';

interface EmailLoginProps {
  onClose: () => void;
}

export function EmailLogin({ onClose }: EmailLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const signUpPromise = supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        
        const result = await Promise.race([
          signUpPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Request timed out')), 10000)
          )
        ]);

        if (result.error) throw result.error;
        alert('Check your email for the confirmation link!');
        onClose();
      } else {
        const signInPromise = supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        const result = await Promise.race([
          signInPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Request timed out')), 10000)
          )
        ]);

        if (result.error) throw result.error;
        onClose();
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Request timed out') {
        setError('Connection timed out. Please try again.');
      } else if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const resetPromise = supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`
      });

      const result = await Promise.race([
        resetPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 10000)
        )
      ]);

      if (result.error) throw result.error;
      setMessage('Check your email for the password reset link');
    } catch (error) {
      if (error instanceof Error && error.message === 'Request timed out') {
        setMessage('Connection timed out. Please try again.');
      } else if (error instanceof AuthError) {
        setMessage(error.message);
      } else {
        setMessage('An error occurred sending reset email');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-xl w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isResetMode ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Sign In')}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={isResetMode ? handlePasswordReset : handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue focus:ring-brand-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
            disabled={loading}
          />
        </div>
        
        {!isResetMode && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue focus:ring-brand-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={loading}
              minLength={6}
            />
          </div>
        )}

        {message && (
          <div className={`text-sm ${message.includes('Check your email') ? 'text-green-400' : 'text-red-400'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-blue hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            isResetMode ? 'Send Reset Link' : (isSignUp ? 'Sign Up' : 'Sign In')
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsResetMode(!isResetMode);
            setMessage('');
            setError(null);
          }}
          className="w-full text-sm text-gray-400 hover:text-white transition-colors"
        >
          {isResetMode ? 'Back to Login' : 'Forgot Password?'}
        </button>
      </form>

      {!isResetMode && (
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage('');
            }}
            className="text-sm text-brand-blue hover:text-opacity-90"
            disabled={loading}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      )}
    </div>
  );
} 