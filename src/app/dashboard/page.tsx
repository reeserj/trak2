'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay } from 'date-fns';

interface Habit {
  id: string;
  title: string;
  content: string;
  type: 'habit';
  period: 'daily' | 'weekly' | 'monthly';
  createdat: string;
  updatedat: string;
  habit_completions: { completed_at: string }[];
}

interface HabitCounts {
  daily: number;
  weekly: number;
  monthly: number;
  total: number;
  topTags: string[];
}

interface JournalStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  totalWords: number;
}

interface HabitStats {
  activeHabits: number;
  completionRate: number;
  longestStreak: number;
  totalCompletions: number;
  mostConsistentHabit: {
    name: string;
    rate: number;
  } | null;
}

interface ActivityCount {
  date: string;
  count: number;
}

interface ActivityDay {
  date: Date;
  count: number;
}

interface TagColor {
  name: string;
  colorbg: string;
  colorfont: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [journalStats, setJournalStats] = useState<JournalStats>({
    totalEntries: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalWords: 0
  });
  const [habitStats, setHabitStats] = useState<HabitStats>({
    activeHabits: 0,
    completionRate: 0,
    longestStreak: 0,
    totalCompletions: 0,
    mostConsistentHabit: null
  });
  const [habitCounts, setHabitCounts] = useState<HabitCounts>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    total: 0,
    topTags: []
  });
  const [activityData, setActivityData] = useState<ActivityDay[]>([]);
  const [tagColors, setTagColors] = useState<Record<string, TagColor>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadJournalStats();
      loadHabitStats();
      loadActivityData();
      loadTagColors();
    }
  }, [user]);

  const loadJournalStats = async () => {
    try {
      // Get total entries and content for word count
      const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select('createdat, content')
        .eq('user_id', user!.id)
        .eq('type', 'journal')
        .order('createdat', { ascending: false });

      if (entriesError) throw entriesError;

      const totalEntries = entries?.length || 0;
      const totalWords = entries?.reduce((acc, entry) => {
        return acc + (entry.content?.match(/\b\w+\b/g)?.length || 0);
      }, 0) || 0;

      // Calculate current streak
      let currentStreak = 0;
      let date = new Date();
      const today = format(date, 'yyyy-MM-dd');
      const yesterday = format(subDays(date, 1), 'yyyy-MM-dd');

      if (entries && entries.length > 0) {
        // Check if there's an entry for today or yesterday to start the streak
        const hasToday = entries.some(entry => format(new Date(entry.createdat), 'yyyy-MM-dd') === today);
        const hasYesterday = entries.some(entry => format(new Date(entry.createdat), 'yyyy-MM-dd') === yesterday);
        
        if (hasToday || hasYesterday) {
          currentStreak = 1;
          // Start checking from yesterday or the day before
          let checkDate = hasToday ? yesterday : format(subDays(date, 2), 'yyyy-MM-dd');
          
          for (let i = 1; i < entries.length; i++) {
            if (format(new Date(entries[i].createdat), 'yyyy-MM-dd') === checkDate) {
              currentStreak++;
              checkDate = format(subDays(new Date(checkDate), 1), 'yyyy-MM-dd');
            } else {
              break;
            }
          }
        }
      }

      // Calculate longest streak
      let longestStreak = currentStreak;
      let tempStreak = 1;

      for (let i = 1; i < (entries?.length || 0); i++) {
        const prevDate = new Date(entries![i-1].createdat);
        const currDate = new Date(entries![i].createdat);
        const dayDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }

      setJournalStats({
        totalEntries,
        currentStreak,
        longestStreak,
        totalWords
      });
    } catch (error) {
      console.error('Error loading journal stats:', error);
    }
  };

  const loadHabitStats = async () => {
    try {
      console.log('Loading habit stats for user:', user!.id);
      
      // Get habit totals from the new view
      const { data: habitTotals, error: habitTotalsError } = await supabase
        .from('habits_total')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (habitTotalsError) {
        console.error('Habit totals query error:', habitTotalsError);
        console.error('Error details:', habitTotalsError.details);
        console.error('Error hint:', habitTotalsError.hint);
        console.error('Error message:', habitTotalsError.message);
        setHabitCounts({
          daily: 0,
          weekly: 0,
          monthly: 0,
          total: 0,
          topTags: []
        });
        return;
      }

      console.log('Fetched habit totals:', habitTotals);

      // Set habit counts from the view data
      const counts = {
        daily: habitTotals?.dailyhabits || 0,
        weekly: habitTotals?.weeklyhabits || 0,
        monthly: habitTotals?.monthlyhabits || 0,
        total: habitTotals?.totalhabits || 0,
        topTags: [] // We'll handle tags separately if needed
      };

      console.log('Setting habit counts:', counts);
      setHabitCounts(counts);

      // Get habits for additional stats
      const { data: habits, error: habitsError } = await supabase
        .from('entries')
        .select(`
          id,
          title,
          content,
          period,
          createdat,
          updatedat,
          user_id,
          type
        `)
        .eq('user_id', user!.id)
        .eq('type', 'habit');

      if (habitsError) {
        console.error('Habits query error:', habitsError);
        throw habitsError;
      }

      if (!habits || habits.length === 0) {
        setHabitStats({
          activeHabits: 0,
          completionRate: 0,
          longestStreak: 0,
          totalCompletions: 0,
          mostConsistentHabit: null
        });
        return;
      }

      const habitIds = habits.map(habit => habit.id);

      // Get completions from streaks view for these habits
      const { data: completions, error: completionsError } = await supabase
        .from('streaks_view')
        .select('entry_id, completed_at')
        .eq('user_id', user!.id)
        .in('entry_id', habitIds);

      if (completionsError) {
        console.error('Completions query error:', completionsError);
        throw completionsError;
      }

      // Calculate habit statistics
      const activeHabits = habits.length;
      const totalCompletions = completions?.length || 0;
      
      // Calculate completion rate
      const completionRate = habits.reduce((acc, habit) => {
        const habitCompletions = completions?.filter(c => c.entry_id === habit.id) || [];
        const expectedCompletions = getExpectedCompletions(habit.period, new Date(habit.createdat));
        return acc + (habitCompletions.length / expectedCompletions);
      }, 0) / activeHabits;

      // Calculate longest streak
      const longestStreak = habits.reduce((maxStreak, habit) => {
        const habitCompletions = completions
          ?.filter(c => c.entry_id === habit.id)
          .map(c => new Date(c.completed_at))
          .sort((a, b) => a.getTime() - b.getTime()) || [];

        let currentStreak = 1;
        let maxCurrentStreak = 1;

        for (let i = 1; i < habitCompletions.length; i++) {
          const dayDiff = Math.floor(
            (habitCompletions[i].getTime() - habitCompletions[i-1].getTime()) / (1000 * 60 * 60 * 24)
          );

          if (dayDiff === 1) {
            currentStreak++;
            maxCurrentStreak = Math.max(maxCurrentStreak, currentStreak);
          } else {
            currentStreak = 1;
          }
        }

        return Math.max(maxStreak, maxCurrentStreak);
      }, 0);

      // Find most consistent habit
      let mostConsistentHabit = null;
      let highestRate = 0;

      habits.forEach(habit => {
        const habitCompletions = completions?.filter(c => c.entry_id === habit.id) || [];
        const expectedCompletions = getExpectedCompletions(habit.period, new Date(habit.createdat));
        const rate = habitCompletions.length / expectedCompletions;

        if (rate > highestRate) {
          highestRate = rate;
          mostConsistentHabit = {
            name: habit.title,
            rate: rate
          };
        }
      });

      console.log('Setting habit stats:', {
        activeHabits,
        completionRate,
        longestStreak,
        totalCompletions,
        mostConsistentHabit
      });

      setHabitStats({
        activeHabits,
        completionRate,
        longestStreak,
        totalCompletions,
        mostConsistentHabit
      });
    } catch (error) {
      console.error('Error loading habit stats:', error);
    }
  };

  const loadActivityData = async () => {
    try {
      if (!user) {
        console.log('No user found, skipping activity data load');
        return;
      }

      console.log('Loading activity data for user:', user.id);
      const endDate = new Date();
      const startDate = subDays(endDate, 364); // Get last 365 days

      console.log('Date range:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Query the activityTracker view
      const { data: activityCounts, error } = await supabase
        .from('activitytracker')
        .select('date, count')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());

      if (error) {
        console.error('Activity query error:', error);
        throw error;
      }

      console.log('Raw activity counts:', activityCounts);

      // Convert to array of ActivityDay objects
      const activityData = eachDayOfInterval({ start: startDate, end: endDate }).map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayData = activityCounts?.find((d: ActivityCount) => {
          const matchResult = format(new Date(d.date), 'yyyy-MM-dd') === dateStr;
          console.log('Matching day:', {
            activityDate: format(new Date(d.date), 'yyyy-MM-dd'),
            currentDate: dateStr,
            matches: matchResult,
            count: d.count
          });
          return matchResult;
        });
        
        const result = {
          date: day,
          count: dayData?.count || 0
        };
        
        if (dayData && dayData.count > 0) {
          console.log('Found activity for date:', {
            date: dateStr,
            count: dayData.count
          });
        }
        
        return result;
      });

      const activeDays = activityData.filter(day => day.count > 0);
      console.log('Activity summary:', {
        totalDays: activityData.length,
        activeDays: activeDays.length,
        sampleActiveDays: activeDays.slice(0, 5).map(day => ({
          date: format(day.date, 'yyyy-MM-dd'),
          count: day.count
        }))
      });

      setActivityData(activityData);
    } catch (error) {
      console.error('Error loading activity data:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    }
  };

  const loadTagColors = async () => {
    const { data, error } = await supabase
      .from('tags')
      .select('name, colorbg, colorfont')
      .eq('user_id', user!.id);

    if (error) {
      console.error('Error loading tag colors:', error);
      return;
    }

    // Create a map of tag names to their colors
    const colorMap = data.reduce((acc, tag) => {
      acc[tag.name] = tag;
      return acc;
    }, {} as Record<string, TagColor>);

    setTagColors(colorMap);
  };

  function getTagColor(tag: string) {
    const tagColor = tagColors[tag];
    if (tagColor) {
      return `bg-[${tagColor.colorbg}] text-[${tagColor.colorfont}]`;
    }
    // Fallback to default styling
    return 'bg-gray-500/20 text-gray-300';
  }

  function getActivityLevel(count: number): string {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (count === 1) return 'bg-green-100 dark:bg-green-900';
    if (count <= 3) return 'bg-green-300 dark:bg-green-700';
    if (count <= 5) return 'bg-green-500 dark:bg-green-500';
    return 'bg-green-700 dark:bg-green-300';
  }

  // Helper function to calculate expected completions based on frequency and creation date
  function getExpectedCompletions(frequency: 'daily' | 'weekly' | 'monthly', createdAt: Date): number {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        return Math.max(1, Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
        
      case 'weekly':
        return Math.max(1, Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 7)));
        
      case 'monthly':
        return Math.max(1, 
          (now.getMonth() - createdAt.getMonth()) + 
          12 * (now.getFullYear() - createdAt.getFullYear())
        );
        
      default:
        return 1;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Track your progress</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Habit Counts Card */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 sm:p-6 shadow-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Habit Breakdown</h3>
            <span className="text-lg">📊</span>
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{habitCounts.total}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Habits</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900 dark:text-white">{habitCounts.daily}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Daily</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900 dark:text-white">{habitCounts.weekly}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Weekly</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900 dark:text-white">{habitCounts.monthly}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Monthly</p>
              </div>
            </div>
            {habitCounts.topTags.length > 0 && (
              <div className="pt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Top Tags</p>
                <div className="flex flex-wrap gap-2">
                  {habitCounts.topTags.map(tag => (
                    <span 
                      key={tag} 
                      className={`px-2 py-1 rounded-full text-xs ${getTagColor(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Journal Stats Card */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 sm:p-6 shadow-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Journal Entries</h3>
            <span className="text-lg">📝</span>
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{journalStats.totalEntries}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Entries</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{journalStats.totalWords.toLocaleString()}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Words Written</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {journalStats.currentStreak} <span className="text-sm">days 🔥</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
              </div>
              <div className="flex-1">
                <div className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {journalStats.longestStreak} <span className="text-sm">days 🏆</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</p>
              </div>
            </div>
          </div>
        </div>

        {/* Habits Stats Card */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 sm:p-6 shadow-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Habits</h3>
            <span className="text-lg">✅</span>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{habitStats.activeHabits}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Habits</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(habitStats.completionRate)}%</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{habitStats.totalCompletions.toLocaleString()}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Completions</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {habitStats.longestStreak} <span className="text-sm">days 🔥</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</p>
              </div>
              <div className="flex-1">
                {habitStats.mostConsistentHabit && (
                  <>
                    <div className="text-base font-semibold text-gray-900 dark:text-white truncate" title={habitStats.mostConsistentHabit.name}>
                      {habitStats.mostConsistentHabit.name}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Most Consistent</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Tracker */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 sm:p-6 shadow-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Tracker</h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">Last year</span>
        </div>
        <div className="overflow-x-auto">
          <div className="relative" style={{ maxWidth: '900px' }}>
            {/* Month labels */}
            <div className="flex text-xs text-gray-600 dark:text-gray-400 mb-2 pl-8">
              {Array.from({ length: 12 }).map((_, i) => {
                const date = new Date();
                date.setDate(1);
                date.setMonth(date.getMonth() - 11 + i);
                return (
                  <div key={i} className="flex-1">
                    {format(date, 'MMM')}
                  </div>
                );
              })}
            </div>
            
            <div className="flex">
              {/* Day labels */}
              <div className="flex flex-col text-xs text-gray-600 dark:text-gray-400 pr-2" style={{ height: '112px', paddingTop: '0px' }}>
                <div style={{ height: '12px', marginTop: '0px' }}>Sun</div>
                <div style={{ height: '12px', marginTop: '16px' }}>Tue</div>
                <div style={{ height: '12px', marginTop: '16px' }}>Thu</div>
                <div style={{ height: '12px', marginTop: '16px' }}>Sat</div>
              </div>

              {/* Activity grid */}
              <div className="flex gap-[2px]" style={{ width: '100%' }}>
                {(() => {
                  // Get start and end dates
                  const endDate = new Date();
                  const startDate = subDays(endDate, 364); // Get last 365 days
                  
                  const weeks = [];
                  let currentDate = startOfWeek(startDate); // Ensure we start on a Sunday
                  
                  // Generate weeks until we reach today
                  while (currentDate <= endDate) {
                    const week = [];
                    // Create 7 days for each week
                    for (let i = 0; i < 7; i++) {
                      const dayDate = new Date(currentDate);
                      if (dayDate <= endDate) {
                        const matchingDay = activityData.find(day => 
                          day.date && isSameDay(new Date(day.date), dayDate)
                        );
                        week.push({
                          date: dayDate,
                          count: matchingDay?.count || 0
                        });
                      } else {
                        week.push(null); // Future dates
                      }
                      currentDate.setDate(currentDate.getDate() + 1);
                    }
                    weeks.push(week);
                  }

                  return weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex-1 flex flex-col gap-[2px] min-w-[10px]">
                      {week.map((day, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={`w-full aspect-square rounded-[1px] ${
                            day ? getActivityLevel(day.count) : 'bg-transparent'
                          }`}
                          title={day ? `${format(day.date, 'MMM d, yyyy')}: ${day.count} activities` : ''}
                        />
                      ))}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-end gap-2 text-xs">
              <span className="text-gray-600 dark:text-gray-400">Less</span>
              <div className="flex gap-[2px]">
                {[0, 2, 4, 6, 8].map(count => (
                  <div
                    key={count}
                    className={`w-[10px] h-[10px] rounded-[1px] ${getActivityLevel(count)}`}
                  />
                ))}
              </div>
              <span className="text-gray-600 dark:text-gray-400">More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 