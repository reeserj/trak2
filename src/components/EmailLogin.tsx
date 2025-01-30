'use client';

import { useState } from 'react';
import { signInWithMagicLink } from '@/lib/supabase';

interface MagicLinkLoginProps {
  onClose: () => void;
}

export function EmailLogin({ onClose }: MagicLinkLoginProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setMessage('');

    try {
      const { error } = await signInWithMagicLink(email);
      
      if (error) {
        console.error('Detailed error:', error);
        // Check for specific error types
        if (error.message?.includes('Database error')) {
          setError('Unable to create account. Please try again later or contact support if the problem persists.');
        } else {
          throw error;
        }
        return;
      }
      
      setMessage('Check your email for the magic link!');
      // Don't close the modal immediately so user can see the success message
      setTimeout(onClose, 3000);
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        // Format the error message to be more user-friendly
        const errorMessage = err.message
          .replace('Database error', 'Account creation failed')
          .replace(/\b(?:auth|database|error)\b/gi, '');
        setError(errorMessage || 'An unexpected error occurred');
      } else {
        setError('An error occurred while sending the magic link');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-xl w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Sign In with Magic Link
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

      {message && (
        <div className="mb-4 p-3 rounded-md bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-200 text-sm">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="Enter your email"
          />
        </div>

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
              Sending Magic Link...
            </span>
          ) : (
            'Send Magic Link'
          )}
        </button>
      </form>

      <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
        We'll send you a magic link to your email. Click it to sign in instantly!
      </p>
    </div>
  );
} 