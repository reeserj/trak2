'use client';

import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';

export function SidebarContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const { user } = useAuth();

  return (
    <main className={`transition-all duration-500 ${
      user ? (
        `${!isCollapsed ? 'delay-[100ms]' : ''} ${isCollapsed ? 'ml-16' : 'ml-64'}`
      ) : ''
    }`}>
      {children}
    </main>
  );
} 