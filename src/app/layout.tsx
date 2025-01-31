import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { AuthProvider } from '@/context/AuthContext'
import { SidebarProvider } from '@/context/SidebarContext'
import { Sidebar } from '@/components/Sidebar'
import { SidebarContent } from '@/components/SidebarContent'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Habit Tracker',
  description: 'A modern habit tracking and journaling app with AI-powered insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        <Providers>
          <AuthProvider>
            <SidebarProvider>
              <div className="relative">
                <Sidebar />
                <SidebarContent>{children}</SidebarContent>
              </div>
            </SidebarProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
} 