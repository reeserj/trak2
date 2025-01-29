'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import { format, subDays, subMonths, subYears } from 'date-fns';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  type: 'journal';
  user_id: string;
  createdat: string;
  updatedat: string;
}

export default function Journal() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentEntry, setCurrentEntry] = useState('');
  const [historicalEntries, setHistoricalEntries] = useState<{
    lastFiveDays: JournalEntry[];
    lastMonth?: JournalEntry;
    lastYear?: JournalEntry;
    twoYearsAgo?: JournalEntry;
    threeYearsAgo?: JournalEntry;
    fourYearsAgo?: JournalEntry;
    fiveYearsAgo?: JournalEntry;
  }>({
    lastFiveDays: []
  });
  const [isPreview, setIsPreview] = useState(false);
  const [hasExistingEntry, setHasExistingEntry] = useState(false);
  const [selectedYear, setSelectedYear] = useState(1); // 1-5 for years ago

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadTodaysEntry();
      loadHistoricalEntries();
    }
  }, [user]);

  const loadTodaysEntry = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const startOfDay = new Date(today);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', user!.id)
      .eq('type', 'journal')
      .gte('createdat', startOfDay.toISOString())
      .lte('createdat', endOfDay.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading today\'s entry:', error);
    }

    if (data) {
      setCurrentEntry(data.content);
      setIsPreview(true);
      setHasExistingEntry(true);
    } else {
      setIsPreview(false);
      setHasExistingEntry(false);
    }
  };

  const loadHistoricalEntries = async () => {
    const today = new Date();
    const lastFiveDays = Array.from({ length: 5 }, (_, i) => ({
      date: subDays(today, i + 1),
      key: `day${i + 1}`
    }));

    const monthAndYearDates = [
      { date: subMonths(today, 1), key: 'lastMonth' },
      { date: subYears(today, 1), key: 'lastYear' },
      { date: subYears(today, 2), key: 'twoYearsAgo' },
      { date: subYears(today, 3), key: 'threeYearsAgo' },
      { date: subYears(today, 4), key: 'fourYearsAgo' },
      { date: subYears(today, 5), key: 'fiveYearsAgo' }
    ];

    const entries: any = {
      lastFiveDays: []
    };

    // Load last 5 days
    for (const { date } of lastFiveDays) {
      const startOfDay = new Date(format(date, 'yyyy-MM-dd'));
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user!.id)
        .eq('type', 'journal')
        .gte('createdat', startOfDay.toISOString())
        .lte('createdat', endOfDay.toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error(`Error loading entry for ${format(date, 'MMM d')}:`, error);
      }

      if (data) {
        entries.lastFiveDays.push(data);
      }
    }

    // Load month and year entries
    for (const { date, key } of monthAndYearDates) {
      const startOfDay = new Date(format(date, 'yyyy-MM-dd'));
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user!.id)
        .eq('type', 'journal')
        .gte('createdat', startOfDay.toISOString())
        .lte('createdat', endOfDay.toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error(`Error loading ${key} entry:`, error);
      }

      if (data) {
        entries[key] = data;
      }
    }

    setHistoricalEntries(entries);
  };

  const saveEntry = async () => {
    if (!currentEntry.trim()) return;

    const today = new Date();
    const startOfDay = new Date(format(today, 'yyyy-MM-dd'));
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: existingEntry } = await supabase
      .from('entries')
      .select('id')
      .eq('user_id', user!.id)
      .eq('type', 'journal')
      .gte('createdat', startOfDay.toISOString())
      .lte('createdat', endOfDay.toISOString())
      .single();

    try {
      if (existingEntry) {
        const { error } = await supabase
          .from('entries')
          .update({ 
            content: currentEntry,
            updatedat: new Date().toISOString()
          })
          .eq('id', existingEntry.id);

        if (error) throw error;
      } else {
        const entryId = crypto.randomUUID();
        const { error } = await supabase
          .from('entries')
          .insert([{ 
            id: entryId,
            content: currentEntry, 
            type: 'journal',
            user_id: user!.id,
            title: `Journal Entry - ${format(new Date(), 'MMMM d, yyyy')}`,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      // Switch to preview mode after successful save
      setIsPreview(true);
      setHasExistingEntry(true);
    } catch (error) {
      console.error('Error saving entry:', error);
      // You might want to show an error notification here
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  const renderMarkdown = (content: string) => (
    <div className="prose prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none">
      <ReactMarkdown
        components={{
          h1: ({...props}) => <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white" {...props} />,
          h2: ({...props}) => <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white" {...props} />,
          h3: ({...props}) => <h3 className="text-base sm:text-lg font-bold mb-2 text-white" {...props} />,
          p: ({...props}) => <p className="text-sm sm:text-base mb-3 sm:mb-4 text-gray-200" {...props} />,
          ul: ({...props}) => <ul className="text-sm sm:text-base list-disc list-inside mb-3 sm:mb-4 text-gray-200" {...props} />,
          ol: ({...props}) => <ol className="text-sm sm:text-base list-decimal list-inside mb-3 sm:mb-4 text-gray-200" {...props} />,
          li: ({...props}) => <li className="mb-1" {...props} />,
          a: ({...props}) => <a className="text-brand-blue hover:underline" {...props} />,
          blockquote: ({...props}) => <blockquote className="text-sm sm:text-base border-l-4 border-gray-500 pl-4 italic my-3 sm:my-4 text-gray-200" {...props} />,
          code: ({...props}) => <code className="text-sm sm:text-base bg-gray-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-gray-200" {...props} />,
          pre: ({...props}) => <pre className="text-sm sm:text-base bg-gray-800 p-3 sm:p-4 rounded my-3 sm:my-4 overflow-x-auto text-gray-200" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  const renderHistoricalEntry = (entry?: JournalEntry, title: string = '') => (
    <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">{title}</h3>
      {entry ? renderMarkdown(entry.content) : (
        <p className="text-sm sm:text-base text-gray-400">No entry for this date</p>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Journal</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Reflect on your journey</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2 sm:gap-4">
          {hasExistingEntry && (
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 text-white text-sm sm:text-base rounded-lg hover:bg-opacity-90 transition-all"
            >
              {isPreview ? 'Edit' : 'Preview'}
            </button>
          )}
          <button
            onClick={saveEntry}
            className="flex-1 sm:flex-none px-4 py-2 bg-brand-blue text-white text-sm sm:text-base rounded-lg hover:bg-opacity-90 shadow-[0_0_15px_rgba(29,99,255,0.5)] hover:shadow-[0_0_20px_rgba(29,99,255,0.7)] transition-all duration-300"
          >
            {hasExistingEntry ? 'Save Changes' : 'Create Entry'}
          </button>
        </div>
      </div>

      {/* Today's Entry */}
      <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
          {hasExistingEntry ? "Today's Entry" : "Create Today's Entry"}
        </h3>
        {isPreview ? (
          renderMarkdown(currentEntry)
        ) : (
          <textarea
            value={currentEntry}
            onChange={(e) => setCurrentEntry(e.target.value)}
            className="w-full h-48 sm:h-64 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm sm:text-base focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none"
            placeholder={hasExistingEntry ? "Write your thoughts here... (Markdown supported)" : "Start writing today's entry... (Markdown supported)"}
          />
        )}
      </div>

      {/* Last 5 Days */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        {Array.from({ length: 5 }, (_, i) => {
          const date = subDays(new Date(), i + 1);
          const entry = historicalEntries.lastFiveDays[i];
          return (
            <div key={i} className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-base font-semibold text-white mb-3">
                {format(date, 'MMMM d')}
              </h3>
              {entry ? (
                renderMarkdown(entry.content)
              ) : (
                <p className="text-sm text-gray-400">No entry for this date</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Monthly and Yearly Entries */}
      <div className="space-y-4 sm:space-y-6">
        {renderHistoricalEntry(historicalEntries.lastMonth, 'Last Month')}
        <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
          <button
            onClick={() => setSelectedYear(1)}
            className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-all ${
              selectedYear === 1 ? 'bg-brand-blue text-white' : 'bg-gray-800 text-gray-300'
            }`}
          >
            Last Year
          </button>
          <button
            onClick={() => setSelectedYear(2)}
            className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-all ${
              selectedYear === 2 ? 'bg-brand-blue text-white' : 'bg-gray-800 text-gray-300'
            }`}
          >
            Two Years Ago
          </button>
          <button
            onClick={() => setSelectedYear(3)}
            className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-all ${
              selectedYear === 3 ? 'bg-brand-blue text-white' : 'bg-gray-800 text-gray-300'
            }`}
          >
            Three Years Ago
          </button>
          <button
            onClick={() => setSelectedYear(4)}
            className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-all ${
              selectedYear === 4 ? 'bg-brand-blue text-white' : 'bg-gray-800 text-gray-300'
            }`}
          >
            Four Years Ago
          </button>
          <button
            onClick={() => setSelectedYear(5)}
            className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-all ${
              selectedYear === 5 ? 'bg-brand-blue text-white' : 'bg-gray-800 text-gray-300'
            }`}
          >
            Five Years Ago
          </button>
        </div>
        {selectedYear === 1 && renderHistoricalEntry(historicalEntries.lastYear, 'Last Year')}
        {selectedYear === 2 && renderHistoricalEntry(historicalEntries.twoYearsAgo, 'Two Years Ago')}
        {selectedYear === 3 && renderHistoricalEntry(historicalEntries.threeYearsAgo, 'Three Years Ago')}
        {selectedYear === 4 && renderHistoricalEntry(historicalEntries.fourYearsAgo, 'Four Years Ago')}
        {selectedYear === 5 && renderHistoricalEntry(historicalEntries.fiveYearsAgo, 'Five Years Ago')}
      </div>
    </div>
  );
} 