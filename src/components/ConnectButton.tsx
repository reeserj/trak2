'use client';

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { EmailLogin } from './EmailLogin';
import { useAuth } from '@/context/AuthContext';

export function ConnectButton() {
  const { isConnected } = useAccount();
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const { user } = useAuth();

  // If connected with Rainbow Kit, show the default connect button
  if (isConnected) {
    return <RainbowConnectButton />;
  }

  // If already logged in with email, don't show anything
  if (user) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <RainbowConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            return (
              <button
                onClick={openConnectModal}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-lg hover:bg-opacity-80 shadow-[0_0_15px_rgba(29,99,255,0.5)] hover:shadow-[0_0_20px_rgba(29,99,255,0.7)] transition-all duration-300"
              >
                Sign in with Wallet
              </button>
            );
          }}
        </RainbowConnectButton.Custom>

        {!isConnected && !showEmailLogin && (
          <button
            onClick={() => setShowEmailLogin(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-lg hover:bg-opacity-80"
          >
            Sign in with Email
          </button>
        )}
      </div>

      {showEmailLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <EmailLogin onClose={() => setShowEmailLogin(false)} />
        </div>
      )}
    </div>
  );
} 