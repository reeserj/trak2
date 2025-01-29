'use client';

import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from './ThemeToggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const { user } = useAuth();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <div className={`fixed left-0 top-0 h-full ${isCollapsed ? 'w-16' : 'w-64'} bg-gray-900/40 backdrop-blur-sm shadow-lg transition-all duration-500 z-20 overflow-hidden`}>
      <div className="flex flex-col h-full transition-all duration-500">
        {/* User Profile Section */}
        <div className={`px-4 py-4 border-b border-gray-700 ${isCollapsed ? 'text-center' : ''} transition-all duration-500`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} transition-all duration-500`}>
            {!isCollapsed && (
              <div className="flex-1 transition-all duration-500">
                <p className="text-sm font-medium text-white truncate transition-all duration-500">
                  {user.email}
                </p>
              </div>
            )}
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-gray-300 hover:text-brand-blue transition-all duration-500"
              title="Sign Out"
            >
              {isCollapsed ? '🚪' : 'Sign Out'}
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-2">
            <li>
              <Link 
                href="/" 
                className={`flex items-center gap-3 p-2 text-gray-300 hover:bg-gray-800/60 rounded-lg transition-all duration-500 ${
                  pathname === '/' ? 'bg-gray-800/60' : ''
                }`}
                title="Home"
              >
                <span className="text-lg">🏠</span>
                {!isCollapsed && <span className="transition-all duration-500">Home</span>}
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard" 
                className={`flex items-center gap-3 p-2 text-gray-300 hover:bg-gray-800/60 rounded-lg transition-all duration-500 ${
                  pathname === '/dashboard' ? 'bg-gray-800/60' : ''
                }`}
                title="Dashboard"
              >
                <span className="text-lg">📊</span>
                {!isCollapsed && <span className="transition-all duration-500">Dashboard</span>}
              </Link>
            </li>
            <li>
              <Link 
                href="/habits" 
                className={`flex items-center gap-3 p-2 text-gray-300 hover:bg-gray-800/60 rounded-lg transition-all duration-500 ${
                  pathname === '/habits' ? 'bg-gray-800/60' : ''
                }`}
                title="Habits"
              >
                <span className="text-lg">✅</span>
                {!isCollapsed && <span className="transition-all duration-500">Habits</span>}
              </Link>
            </li>
            <li>
              <Link 
                href="/journal" 
                className={`flex items-center gap-3 p-2 text-gray-300 hover:bg-gray-800/60 rounded-lg transition-all duration-500 ${
                  pathname === '/journal' ? 'bg-gray-800/60' : ''
                }`}
                title="Journal"
              >
                <span className="text-lg">📝</span>
                {!isCollapsed && <span className="transition-all duration-500">Journal</span>}
              </Link>
            </li>
          </ul>
        </nav>

        {/* Settings and Collapse at Bottom */}
        <div className="px-4 py-4 border-t border-gray-700">
          <div className="flex flex-col gap-2">
            <div
              onClick={() => document.querySelector<HTMLButtonElement>('[aria-label="Toggle theme"]')?.click()}
              className="flex items-center gap-3 p-2 text-gray-300 hover:bg-gray-800/60 rounded-lg transition-all duration-500 cursor-pointer"
              title="Theme"
            >
              <ThemeToggle inSidebar={true} />
              {!isCollapsed && <span className="transition-all duration-500">Theme</span>}
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-3 p-2 text-gray-300 hover:bg-gray-800/60 rounded-lg transition-all duration-500"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <span className="text-lg">{isCollapsed ? '→' : '←'}</span>
              {!isCollapsed && <span className="transition-all duration-500">Collapse</span>}
            </button>
            <Link 
              href="/settings" 
              className={`flex items-center gap-3 p-2 text-gray-300 hover:bg-gray-800/60 rounded-lg transition-all duration-500 ${
                pathname === '/settings' ? 'bg-gray-800/60' : ''
              }`}
              title="Settings"
            >
              <span className="text-lg">⚙️</span>
              {!isCollapsed && <span className="transition-all duration-500">Settings</span>}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 