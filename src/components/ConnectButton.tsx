'use client';

import { useState } from 'react';
import { EmailLogin } from './EmailLogin';
import { useAuth } from '@/context/AuthContext';

export function ConnectButton() {
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const { user } = useAuth();

  // If already logged in with email, don't show anything
  if (user) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={() => setShowEmailLogin(true)}
        className="px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-lg hover:bg-opacity-80"
      >
        Sign in with Email
      </button>

      {showEmailLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <EmailLogin onClose={() => setShowEmailLogin(false)} />
        </div>
      )}
    </div>
  );
} 