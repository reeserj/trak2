'use client';

import { ConnectButton } from '@/components/ConnectButton'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-blue-100 to-white dark:from-gray-900 dark:via-gray-800 dark:to-black animate-gradient-shift bg-[length:200%_200%] p-6">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <div className="relative px-6 lg:px-8">
        <div className="mx-auto max-w-3xl pt-20 pb-32 sm:pt-48 sm:pb-40">
          <div>
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <Link 
                href="/dashboard" 
                className="relative overflow-hidden rounded-full py-1.5 px-4 text-sm leading-6 ring-1 ring-gray-900/10 hover:ring-gray-900/20 dark:ring-gray-100/10 dark:hover:ring-gray-100/20 transition-all hover:scale-105"
              >
                <span className="text-gray-600 dark:text-gray-300">
                  Track your progress, transform your life{' '}
                  <span className="font-semibold text-brand-blue">→</span>
                </span>
              </Link>
            </div>
            <div className="text-center">
              <Link 
                href="/dashboard" 
                className="inline-block hover:scale-105 transition-transform"
              >
                <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-brand-blue to-purple-600 text-transparent bg-clip-text">
                  Build Better Habits
                </h1>
              </Link>
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                Your personal journey to success, powered by AI insights and thoughtful journaling.
                Track habits, reflect on progress, and achieve your goals.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <ConnectButton />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-20">
        <div className="mx-auto max-w-2xl lg:max-w-4xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Habit Tracking */}
            <div className="relative overflow-hidden rounded-lg p-6 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-brand-blue text-2xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Smart Habit Tracking</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Create custom habits, set goals, and track your progress with intuitive tools.
              </p>
            </div>

            {/* Journaling */}
            <div className="relative overflow-hidden rounded-lg p-6 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-brand-blue text-2xl mb-3">📝</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reflective Journaling</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Express yourself freely with markdown support and AI-powered writing prompts.
              </p>
            </div>

            {/* AI Insights */}
            <div className="relative overflow-hidden rounded-lg p-6 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-brand-blue text-2xl mb-3">🤖</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI-Powered Insights</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Get personalized coaching and deep insights into your habits and progress.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 