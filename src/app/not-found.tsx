'use client';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">404 - Page Not Found</h1>
        <p className="text-gray-400 mb-8">The page you're looking for doesn't exist.</p>
        <a 
          href="/trak2"
          className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-opacity-90"
        >
          Go Home
        </a>
      </div>
    </div>
  );
} 