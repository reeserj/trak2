'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSidebar } from '@/context/SidebarContext';

type PeriodType = 'daily' | 'weekly' | 'monthly';

interface Tag {
  id: string;
  name: string;
  entry_id: string;
  user_id: string;
  createdat: string;
}

interface Reminder {
  id?: string;
  frequency?: string;
  time?: string;
  type?: string;
  enabled: boolean;
}

interface Habit {
  id: string;
  title: string;
  content: string;
  type: 'habit';
  period: PeriodType;
  user_id: string;
  createdat: string;
  updatedat: string;
  tags?: Tag[];
  completed?: boolean;
  currentStreak?: number;
  reminder?: Reminder;
}

// Add type definition for Activity
interface Activity {
  habit: Habit;
  date: Date;
  type: 'created' | 'updated' | 'completed';
  streakCount?: number;
}

export default function Habits() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showEditHabit, setShowEditHabit] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [topTags, setTopTags] = useState<Tag[]>([]);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    period: 'daily' as PeriodType,
    reminder: {
      enabled: false,
      frequency: 'daily',
      time: '',
      type: 'habit'
    },
    tags: [] as string[]
  });
  const [tagInput, setTagInput] = useState('');
  const [editTagInput, setEditTagInput] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0
  });

  // Move loadHabits to component scope
  const loadHabits = async () => {
    if (!user) return;

    console.log('Loading habits for user:', user.id);

    // First get all habits from entries table
    const { data: habitsData, error: habitsError } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'habit')
      .order('createdat', { ascending: false });

    if (habitsError) {
      console.error('Error loading habits:', habitsError);
      return;
    }

    console.log('Fetched habits:', habitsData);

    // Ensure all habits have valid JSON content
    const validHabits = habitsData?.map(habit => {
      try {
        // If content is a string but not JSON, convert it to JSON format
        if (typeof habit.content === 'string' && !habit.content.startsWith('{')) {
          const updatedHabit = {
            ...habit,
            content: JSON.stringify({
              description: habit.content,
              frequency: habit.period
            })
          };
          
          // Update the habit in the database with valid JSON
          supabase
            .from('entries')
            .update({ content: updatedHabit.content })
            .eq('id', habit.id)
            .then(({ error }) => {
              if (error) console.error('Error updating habit content:', error);
            });
            
          return updatedHabit;
        }
        // Try to parse existing content
        JSON.parse(habit.content);
        return habit;
      } catch (e) {
        // If parsing fails, create valid JSON
        const updatedContent = JSON.stringify({
          description: habit.content || '',
          frequency: habit.period
        });
        
        // Update the habit in the database with valid JSON
        supabase
          .from('entries')
          .update({ content: updatedContent })
          .eq('id', habit.id)
          .then(({ error }) => {
            if (error) console.error('Error updating habit content:', error);
          });
          
        return {
          ...habit,
          content: updatedContent
        };
      }
    }) || [];

    if (validHabits.length > 0) {
      const habitIds = validHabits.map(habit => habit.id);
      console.log('Habit IDs:', habitIds);
      
      // Get tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .in('entry_id', habitIds);

      if (tagsError) {
        console.error('Error loading tags:', tagsError);
        return;
      }

      // Get all completions for calculating streaks
      const completionsPromises = validHabits.map(async (habit) => {
        const { data: completions } = await supabase
          .from('entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'habit_completion')
          .order('createdat', { ascending: false });

        // Filter and sort completions for this habit
        const habitCompletions = completions
          ?.filter(entry => {
            try {
              const content = JSON.parse(entry.content);
              return content.completed_habit_id === habit.id;
            } catch {
              return false;
            }
          })
          .map(entry => new Date(entry.createdat))
          .sort((a, b) => b.getTime() - a.getTime()) || [];

        // Calculate current streak
        let currentStreak = 0;
        const now = new Date();
        
        for (let i = 0; i < habitCompletions.length; i++) {
          const completionDate = habitCompletions[i];
          
          if (i === 0) {
            // Check if the most recent completion is within the current period
            const periodStart = getStartOfPeriod(habit.period);
            const periodEnd = getEndOfPeriod(habit.period);
            
            if (completionDate >= periodStart && completionDate <= periodEnd) {
              currentStreak = 1;
            } else {
              break;
            }
          } else {
            // Check if this completion is in the previous period
            const prevCompletion = habitCompletions[i - 1];
            const isConsecutive = isConsecutivePeriod(habit.period, completionDate, prevCompletion);
            
            if (isConsecutive) {
              currentStreak++;
            } else {
              break;
            }
          }
        }

        return {
          habitId: habit.id,
          currentStreak,
          completions: habitCompletions
        };
      });

      const completionsResults = await Promise.all(completionsPromises);

      // Combine habits with their tags and completion status
      const habitsWithData = validHabits.map(habit => {
        const habitTags = tagsData?.filter(tag => tag.entry_id === habit.id) || [];
        const completionData = completionsResults.find(c => c.habitId === habit.id);
        const periodStart = getStartOfPeriod(habit.period);
        const periodEnd = getEndOfPeriod(habit.period);
        
        return {
          ...habit,
          tags: habitTags,
          completed: completionData?.completions.some(date => 
            date >= periodStart && date <= periodEnd
          ) || false,
          currentStreak: completionData?.currentStreak || 0
        };
      });

      console.log('Setting habits:', habitsWithData);
      setHabits(habitsWithData);
    } else {
      console.log('No habits found');
      setHabits([]);
    }
  };

  // Add helper function to check if two dates are in consecutive periods
  const isConsecutivePeriod = (period: PeriodType, date1: Date, date2: Date): boolean => {
    switch (period) {
      case 'daily':
        // Check if dates are consecutive days
        const dayDiff = Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
        return dayDiff === 1;
        
      case 'weekly':
        // Check if dates are in consecutive weeks
        const week1 = new Date(date1);
        const week2 = new Date(date2);
        while (week1.getDay() !== 0) week1.setDate(week1.getDate() - 1);
        while (week2.getDay() !== 0) week2.setDate(week2.getDate() - 1);
        const weekDiff = (week2.getTime() - week1.getTime()) / (7 * 24 * 60 * 60 * 1000);
        return weekDiff === 1;
        
      case 'monthly':
        // Check if dates are in consecutive months
        return (
          date1.getMonth() === (date2.getMonth() + 1) % 12 &&
          (date1.getMonth() === 0 ? date1.getFullYear() === date2.getFullYear() + 1 : date1.getFullYear() === date2.getFullYear())
        );
        
      default:
        return false;
    }
  };

  // Load habits on mount
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      const loadData = async () => {
        try {
          console.log('Starting to load data...');
          await loadHabits();
          await loadHabitStats();
          await loadTopTags();
          console.log('All data loaded successfully');
        } catch (error) {
          console.error('Error loading data:', error);
        }
      };
      loadData();
    }
  }, [user, loading, router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  const getHabitsByPeriod = (period: PeriodType) => {
    return habits.filter(habit => habit.period === period);
  };

  // Add getStreakText function
  const getStreakText = (streak: number, period: PeriodType) => {
    if (streak === 0) return '';
    
    switch (period) {
      case 'daily':
        return `${streak} day${streak > 1 ? 's' : ''} streak`;
      case 'weekly':
        return `${streak} week${streak > 1 ? 's' : ''} streak`;
      case 'monthly':
        return `${streak} month${streak > 1 ? 's' : ''} streak`;
      default:
        return '';
    }
  };

  // Update getRecentActivity with correct field handling
  const getRecentActivity = async () => {
    if (!user) {
      console.log('No user, skipping activity load');
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    console.log('Loading activities since:', thirtyDaysAgo);

    try {
      // First get all habit entries
      const { data: habitEntries, error: habitsError } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'habit')
        .gte('createdat', thirtyDaysAgo.toISOString())
        .order('createdat', { ascending: false });

      if (habitsError) {
        console.error('Error fetching habits:', habitsError);
        return;
      }

      console.log('Fetched habit entries:', habitEntries);

      // Then get all completion entries
      const { data: completionEntries, error: completionsError } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'habit_completion')
        .gte('createdat', thirtyDaysAgo.toISOString())
        .order('createdat', { ascending: false });

      if (completionsError) {
        console.error('Error fetching completions:', completionsError);
        return;
      }

      console.log('Fetched completion entries:', completionEntries);

      let newActivities: Activity[] = [];

      // Add habit creations
      for (const entry of habitEntries || []) {
        console.log('Processing habit entry:', entry);
        const habit: Habit = {
          id: entry.id,
          title: entry.title,
          content: entry.content,
          type: 'habit',
          period: entry.period as PeriodType,
          user_id: entry.user_id,
          createdat: entry.createdat,
          updatedat: entry.updatedat,
          tags: entry.tags || []
        };

        // Add creation activity
        newActivities.push({
          habit,
          date: new Date(entry.createdat),
          type: 'created'
        });

        // Add update activity if the habit was updated
        if (entry.updatedat !== entry.createdat) {
          newActivities.push({
            habit,
            date: new Date(entry.updatedat),
            type: 'updated'
          });
        }
      }

      // Add completions
      for (const completion of completionEntries || []) {
        try {
          const content = JSON.parse(completion.content);
          const completedHabitId = content.completed_habit_id;
          console.log('Processing completion for habit:', completedHabitId);

          // Find the corresponding habit
          const habitEntry = habitEntries?.find(h => h.id === completedHabitId);
          
          if (habitEntry) {
            console.log('Found matching habit:', habitEntry.title);
            const habit: Habit = {
              id: habitEntry.id,
              title: habitEntry.title,
              content: habitEntry.content,
              type: 'habit',
              period: habitEntry.period as PeriodType,
              user_id: habitEntry.user_id,
              createdat: habitEntry.createdat,
              updatedat: habitEntry.updatedat,
              tags: habitEntry.tags || []
            };

            // Count completions for streak
            const streakCount = completionEntries.filter(c => {
              try {
                const cContent = JSON.parse(c.content);
                return cContent.completed_habit_id === completedHabitId;
              } catch {
                return false;
              }
            }).length;

            console.log('Adding completion with streak:', streakCount);
            newActivities.push({
              habit,
              date: new Date(completion.createdat),
              type: 'completed',
              streakCount: streakCount > 1 ? streakCount : undefined
            });
          } else {
            console.log('No matching habit found for completion');
          }
        } catch (error) {
          console.error('Error processing completion:', error);
        }
      }

      // Apply tag filter if selected
      if (selectedTag) {
        console.log('Filtering by tag:', selectedTag);
        newActivities = newActivities.filter(activity => 
          activity.habit.tags?.some(tag => tag.name === selectedTag)
        );
      }

      // Sort by date, most recent first
      newActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      console.log('Setting activities:', newActivities);
      setActivities(newActivities);
    } catch (error) {
      console.error('Error loading activity data:', error);
    }
  };

  // Keep activities in sync with habits and tag changes
  useEffect(() => {
    if (user && habits.length > 0) {
      getRecentActivity().catch(console.error);
    }
  }, [user, selectedTag, habits]);

  // Also load activities after completing a habit
  const handleToggleComplete = async (habit: Habit) => {
    if (!user) return;

    const wasCompleted = Boolean(habit.completed);
    
    try {
      const now = new Date();
      
      // Optimistically update the UI
      setHabits(prevHabits => 
        prevHabits.map(h => {
          if (h.id === habit.id) {
            const currentStreak = h.currentStreak || 0;
            return {
              ...h,
              completed: !wasCompleted,
              currentStreak: !wasCompleted ? (currentStreak + 1) : (currentStreak - 1)
            };
          }
          return h;
        })
      );
      
      if (!wasCompleted) {
        // Add new completion entry
        const newEntryId = crypto.randomUUID();
        
        const { error: insertError } = await supabase
          .from('entries')
          .insert([{
            id: newEntryId,
            user_id: user.id,
            title: `${habit.title} Completion`,
            content: JSON.stringify({
              completed_habit_id: habit.id,
              completed_at: now.toISOString()
            }),
            type: 'habit_completion',
            createdat: now.toISOString(),
            updatedat: now.toISOString()
          }]);

        if (insertError) {
          console.error('Error adding completion:', insertError);
          // Revert optimistic update if there's an error
          setHabits(prevHabits =>
            prevHabits.map(h => {
              if (h.id === habit.id) {
                const currentStreak = h.currentStreak || 0;
                return {
                  ...h,
                  completed: wasCompleted,
                  currentStreak: currentStreak - 1
                };
              }
              return h;
            })
          );
          return;
        }
      } else {
        // Find and delete the completion entry
        const { data: completions } = await supabase
          .from('entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'habit_completion')
          .gte('createdat', getStartOfPeriod(habit.period).toISOString())
          .lte('createdat', getEndOfPeriod(habit.period).toISOString());

        const completionToDelete = completions?.find(entry => {
          try {
            const content = JSON.parse(entry.content);
            return content.completed_habit_id === habit.id;
          } catch {
            return false;
          }
        });

        if (completionToDelete) {
          const { error: deleteError } = await supabase
            .from('entries')
            .delete()
            .eq('id', completionToDelete.id);

          if (deleteError) {
            console.error('Error deleting completion:', deleteError);
            // Revert optimistic update if there's an error
            setHabits(prevHabits =>
              prevHabits.map(h => {
                if (h.id === habit.id) {
                  const currentStreak = h.currentStreak || 0;
                  return {
                    ...h,
                    completed: wasCompleted,
                    currentStreak: currentStreak + 1
                  };
                }
                return h;
              })
            );
            return;
          }
        }
      }

      // Only refresh activities after successful database operation
      await getRecentActivity();

    } catch (error) {
      console.error('Error toggling habit completion:', error);
      // Revert optimistic update on any other error
      setHabits(prevHabits =>
        prevHabits.map(h => {
          if (h.id === habit.id) {
            return {
              ...h,
              completed: wasCompleted,
              currentStreak: wasCompleted ? (h.currentStreak || 0) + 1 : (h.currentStreak || 0) - 1
            };
          }
          return h;
        })
      );
    }
  };

  // Helper functions for getting period boundaries
  const getStartOfPeriod = (period: PeriodType): Date => {
    const now = new Date();
    const start = new Date(now);
    
    switch (period) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        return start;
        
      case 'weekly':
        // Get the start of the current week (Sunday)
        while (start.getDay() !== 0) start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        return start;
        
      case 'monthly':
        // Get the start of the current month
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        return start;
        
      default:
        return start;
    }
  };

  const getEndOfPeriod = (period: PeriodType): Date => {
    const now = new Date();
    const end = new Date(now);
    
    switch (period) {
      case 'daily':
        end.setHours(23, 59, 59, 999);
        return end;
        
      case 'weekly':
        // Get the end of the current week (Saturday)
        while (end.getDay() !== 6) end.setDate(end.getDate() + 1);
        end.setHours(23, 59, 59, 999);
        return end;
        
      case 'monthly':
        // Get the end of the current month
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        return end;
        
      default:
        return end;
    }
  };

  // Add a helper function to parse content
  const parseHabitContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      return parsed.description || '';
    } catch (e) {
      return content;
    }
  };

  // Update the habit card rendering
  const renderHabitCard = (habit: Habit) => (
    <div 
      key={habit.id} 
      className="flex flex-col p-3 bg-gray-800/60 rounded-lg hover:bg-gray-800/80 transition-colors cursor-pointer"
      onClick={() => handleEditHabit(habit)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggleComplete(habit);
            }}
            className={`w-5 h-5 rounded border ${
              habit.completed 
                ? 'bg-brand-blue border-brand-blue text-white' 
                : 'border-gray-500 hover:border-brand-blue'
            } flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue`}
            aria-label={habit.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {habit.completed && (
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6L5 9L10 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`font-medium text-white ${habit.completed ? 'line-through opacity-70' : ''}`}>
                {habit.title}
              </h4>
            </div>
            <p className={`text-sm text-gray-300 ${habit.completed ? 'line-through opacity-70' : ''}`}>
              {parseHabitContent(habit.content)}
            </p>
          </div>
        </div>
        <button 
          className="p-2 hover:bg-gray-700/60 rounded-lg text-gray-300"
          onClick={(e) => {
            e.stopPropagation();
            handleEditHabit(habit);
          }}
        >
          ⋮
        </button>
      </div>
      <div className="space-y-2">
        {habit.tags && habit.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {habit.tags.map(tag => (
              <button 
                key={tag.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTagClick(tag.name);
                }}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  getTagColor(tag.name)
                } ${
                  selectedTag === tag.name ? 'ring-2 ring-white' : ''
                } hover:ring-2 hover:ring-white/50 transition-all cursor-pointer`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
        {(habit.currentStreak ?? 0) > 0 && (
          <div className="flex items-center">
            <span className="text-xs px-2 py-0.5 bg-brand-blue/20 text-brand-blue rounded-full">
              {getStreakText(habit.currentStreak ?? 0, habit.period)} 🔥
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const handleTagClick = (tagName: string) => {
    setSelectedTag(selectedTag === tagName ? null : tagName);
  };

  const getFilteredHabits = (period: PeriodType) => {
    let filtered = habits.filter(habit => habit.period === period);
    if (selectedTag) {
      filtered = filtered.filter(habit => 
        habit.tags?.some(tag => tag.name === selectedTag)
      );
    }
    return filtered;
  };

  const handleAddEditTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && editTagInput.trim() && editingHabit) {
      e.preventDefault();
      const newTag = {
        id: Date.now().toString(), // Temporary ID for new tag
        name: editTagInput.trim(),
        entry_id: editingHabit.id,
        user_id: editingHabit.user_id,
        createdat: new Date().toISOString()
      };
      
      if (!editingHabit.tags?.some(tag => tag.name === editTagInput.trim())) {
        setEditingHabit({
          ...editingHabit,
          tags: [...(editingHabit.tags || []), newTag]
        });
      }
      setEditTagInput('');
    }
  };

  const handleRemoveEditTag = (tagToRemove: Tag) => {
    if (editingHabit) {
      setEditingHabit({
        ...editingHabit,
        tags: editingHabit.tags?.filter(tag => tag.id !== tagToRemove.id) || []
      });
    }
  };

  // Add function to load top tags
  const loadTopTags = async () => {
    if (!user) return;

    const { data: tagsData, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .order('createdat', { ascending: false });

    if (error) {
      console.error('Error loading tags:', error);
      return;
    }

    // Get unique tags and take top 5
    const uniqueTags = Array.from(new Set(tagsData.map(tag => tag.name)))
      .slice(0, 5)
      .map(name => tagsData.find(tag => tag.name === name)!);

    setTopTags(uniqueTags);
  };

  // Add this function to generate consistent colors for tags
  const getTagColor = (tagName: string) => {
    const colors = [
      'bg-blue-500/20 text-blue-400',
      'bg-purple-500/20 text-purple-400',
      'bg-green-500/20 text-green-400',
      'bg-pink-500/20 text-pink-400',
      'bg-yellow-500/20 text-yellow-400',
      'bg-indigo-500/20 text-indigo-400'
    ];
    // Use the sum of character codes to pick a consistent color
    const sum = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  const handleEditHabit = (habit: Habit) => {
    // Parse the content when setting up for edit
    const parsedContent = parseHabitContent(habit.content);
    setEditingHabit({
      ...habit,
      content: parsedContent
    });
    setShowEditHabit(true);
  };

  const handleUpdateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingHabit) return;

    try {
      // Update the habit with proper JSON content
      const { error: habitError } = await supabase
        .from('entries')
        .update({
          title: editingHabit.title,
          content: JSON.stringify({
            description: editingHabit.content,
            frequency: editingHabit.period
          }),
          period: editingHabit.period,
          updatedat: new Date().toISOString()
        })
        .eq('id', editingHabit.id)
        .eq('type', 'habit');

      if (habitError) throw habitError;

      // Update tags if changed
      if (editingHabit.tags) {
        // First delete existing tags
        await supabase
          .from('tags')
          .delete()
          .eq('entry_id', editingHabit.id);

        // Then add new tags
        if (editingHabit.tags.length > 0) {
          const { error: tagsError } = await supabase
            .from('tags')
            .insert(
              editingHabit.tags.map(tag => ({
                name: tag.name,
                entry_id: editingHabit.id,
                user_id: user.id,
                createdat: new Date().toISOString()
              }))
            );

          if (tagsError) throw tagsError;
        }
      }

      // Update reminder if present
      if (editingHabit.reminder) {
        if (editingHabit.reminder.id) {
          // Update existing reminder
          const { error: reminderError } = await supabase
            .from('reminders')
            .update({
              frequency: editingHabit.reminder.frequency,
              time: editingHabit.reminder.time,
              type: 'habit'
            })
            .eq('id', editingHabit.reminder.id);

          if (reminderError) throw reminderError;
        } else if (editingHabit.reminder.enabled && editingHabit.reminder.time) {
          // Create new reminder
          const { error: reminderError } = await supabase
            .from('reminders')
            .insert([{
              entry_id: editingHabit.id,
              frequency: editingHabit.reminder.frequency,
              time: editingHabit.reminder.time,
              type: 'habit',
              createdat: new Date().toISOString()
            }]);

          if (reminderError) throw reminderError;
        }
      }

      // Update local state
      setHabits(prevHabits => 
        prevHabits.map(h => h.id === editingHabit.id ? {
          ...editingHabit,
          content: JSON.stringify({
            description: editingHabit.content,
            frequency: editingHabit.period
          })
        } : h)
      );
      setShowEditHabit(false);
      setEditingHabit(null);
      
      // Reload habits and activities
      await loadHabits();
      await getRecentActivity();
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  // Add delete habit handler
  const handleDeleteHabit = async (habitId: string) => {
    if (!user) return;

    try {
      // First delete all related tags
      const { error: tagsError } = await supabase
        .from('tags')
        .delete()
        .eq('entry_id', habitId);

      if (tagsError) {
        console.error('Error deleting tags:', tagsError);
        return;
      }

      // Get all completions first
      const { data: completions, error: fetchError } = await supabase
        .from('entries')
        .select('id, content')
        .eq('type', 'habit_completion');

      if (fetchError) {
        console.error('Error fetching completions:', fetchError);
        return;
      }

      // Filter completions for this habit
      const completionIds = completions
        ?.filter(entry => {
          try {
            const content = JSON.parse(entry.content);
            return content.completed_habit_id === habitId;
          } catch {
            return false;
          }
        })
        .map(entry => entry.id);

      if (completionIds && completionIds.length > 0) {
        // Delete the filtered completions
        const { error: completionsError } = await supabase
          .from('entries')
          .delete()
          .in('id', completionIds);

        if (completionsError) {
          console.error('Error deleting completions:', completionsError);
          return;
        }
      }

      // Finally delete the habit itself
      const { error: habitError } = await supabase
        .from('entries')
        .delete()
        .eq('id', habitId)
        .eq('type', 'habit');

      if (habitError) {
        console.error('Error deleting habit:', habitError);
        return;
      }

      // Update local state
      setHabits(prevHabits => prevHabits.filter(h => h.id !== habitId));
      setShowEditHabit(false);
      setEditingHabit(null);

      // Refresh activities
      await getRecentActivity();
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  // Helper functions
  const formatDate = (date: Date) => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    }
  };

  // Update loadHabitStats function
  const loadHabitStats = async () => {
    if (!user) return;

    try {
      // Get total habits count
      const { data: habitsData, error: habitsError } = await supabase
        .from('entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'habit');

      if (habitsError) {
        console.error('Error loading habit stats:', habitsError);
        return;
      }

      // Get total completions count
      const { data: completionsData, error: completionsError } = await supabase
        .from('entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'habit_completion');

      if (completionsError) {
        console.error('Error loading completion stats:', completionsError);
        return;
      }

      // Get active habits (habits with completions in the last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: activeHabitsData, error: activeError } = await supabase
        .from('entries')
        .select('id, content')
        .eq('user_id', user.id)
        .eq('type', 'habit_completion')
        .gte('createdat', sevenDaysAgo.toISOString());

      if (activeError) {
        console.error('Error loading active habits:', activeError);
        return;
      }

      // Get unique habit IDs from completions
      const uniqueActiveHabits = new Set(
        (activeHabitsData || []).map(completion => {
          try {
            const content = JSON.parse(completion.content);
            return content.completed_habit_id;
          } catch {
            return null;
          }
        }).filter(Boolean)
      );

      setStats({
        total: habitsData?.length || 0,
        active: uniqueActiveHabits.size,
        completed: completionsData?.length || 0
      });

    } catch (error) {
      console.error('Error loading habit stats:', error);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!newHabit.tags.includes(tagInput.trim())) {
        setNewHabit(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewHabit(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Generate a UUID for the new habit
      const habitId = crypto.randomUUID();

      // Create new habit in entries table
      const { data: habit, error: habitError } = await supabase
        .from('entries')
        .insert([
          {
            id: habitId,
            title: newHabit.name,
            content: JSON.stringify({
              description: newHabit.description,
              frequency: newHabit.period
            }),
            type: 'habit',
            period: newHabit.period,
            user_id: user.id,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (habitError) throw habitError;

      // Create tags if any
      if (newHabit.tags.length > 0) {
        const { error: tagsError } = await supabase
          .from('tags')
          .insert(
            newHabit.tags.map(tag => ({
              name: tag,
              entry_id: habit.id,
              user_id: user.id,
              createdat: new Date().toISOString()
            }))
          );

        if (tagsError) throw tagsError;
      }

      // Create reminder if enabled
      if (newHabit.reminder.enabled && newHabit.reminder.time) {
        const { error: reminderError } = await supabase
          .from('reminders')
          .insert([
            {
              entry_id: habit.id,
              frequency: newHabit.reminder.frequency,
              type: 'habit',
              time: newHabit.reminder.time,
              createdat: new Date().toISOString()
            }
          ]);

        if (reminderError) throw reminderError;
      }

      // Reset form and refresh habits
      setNewHabit({
        name: '',
        description: '',
        period: 'daily',
        reminder: {
          enabled: false,
          frequency: 'daily',
          time: '',
          type: 'habit'
        },
        tags: []
      });
      setShowAddHabit(false);
      await loadHabits();
      await getRecentActivity();

    } catch (error) {
      console.error('Error creating habit:', error);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-white/50 via-blue-100/30 to-white/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-black/50 animate-gradient-shift bg-[length:200%_200%] fixed inset-0 -z-10" />
      <div className="p-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Habits</h1>
            <p className="text-gray-600 dark:text-gray-400">Track and manage your daily habits</p>
          </div>
          <button
            onClick={() => setShowAddHabit(true)}
            className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-opacity-90 shadow-[0_0_15px_rgba(29,99,255,0.5)] hover:shadow-[0_0_20px_rgba(29,99,255,0.7)] transition-all duration-300"
          >
            + New Habit
          </button>
        </div>

        {/* Habit Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Daily Habits</h3>
            <div className="space-y-4">
              {getFilteredHabits('daily').map(habit => renderHabitCard(habit))}
              {getFilteredHabits('daily').length === 0 && (
                <p className="text-gray-400 text-center py-4">
                  {selectedTag ? `No daily habits with tag "${selectedTag}"` : 'No daily habits yet'}
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Weekly Habits</h3>
            <div className="space-y-4">
              {getFilteredHabits('weekly').map(habit => renderHabitCard(habit))}
              {getFilteredHabits('weekly').length === 0 && (
                <p className="text-gray-400 text-center py-4">
                  {selectedTag ? `No weekly habits with tag "${selectedTag}"` : 'No weekly habits yet'}
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Monthly Goals</h3>
            <div className="space-y-4">
              {getFilteredHabits('monthly').map(habit => renderHabitCard(habit))}
              {getFilteredHabits('monthly').length === 0 && (
                <p className="text-gray-400 text-center py-4">
                  {selectedTag ? `No monthly habits with tag "${selectedTag}"` : 'No monthly goals yet'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900/40 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No activity in the last 30 days</p>
            ) : (
              activities.map((activity, index) => {
                return (
                  <div key={`${activity.habit.id}-${index}`} className="flex items-center gap-4 text-sm">
                    <div className="w-24 text-gray-300">{formatDate(activity.date)}</div>
                    <div className="flex-1 bg-gray-800/60 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                          {activity.type === 'completed' ? (
                            <span className="text-green-400">✓</span>
                          ) : activity.type === 'created' ? (
                            <span className="text-brand-blue">+</span>
                          ) : (
                            <span className="text-yellow-400">⟳</span>
                          )}
                          <span>
                            {activity.type === 'completed' ? (
                              `Completed habit: ${activity.habit.title}`
                            ) : activity.type === 'created' ? (
                              `Created habit: ${activity.habit.title}`
                            ) : (
                              `Updated habit: ${activity.habit.title}`
                            )}
                          </span>
                        </div>
                        {activity.type === 'completed' && activity.streakCount && activity.streakCount > 1 && (
                          <span className="text-xs px-2 py-0.5 bg-brand-blue/20 text-brand-blue rounded-full">
                            {getStreakText(activity.streakCount, activity.habit.period)} 🔥
                          </span>
                        )}
                      </div>
                      {activity.habit.tags && activity.habit.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {activity.habit.tags.map(tag => (
                            <span 
                              key={tag.id}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag.name)}`}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Habit Modal */}
      {showAddHabit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/90 rounded-xl p-6 w-full max-w-md m-4 shadow-xl border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Create New Habit</h2>
              <button
                onClick={() => setShowAddHabit(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateHabit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="e.g., Morning Meditation"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Describe your habit..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Period
                </label>
                <select
                  value={newHabit.period}
                  onChange={(e) => setNewHabit({ ...newHabit, period: e.target.value as PeriodType })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="remind"
                    checked={newHabit.reminder.enabled}
                    onChange={(e) => setNewHabit({ ...newHabit, reminder: { ...newHabit.reminder, enabled: e.target.checked } })}
                    className="w-4 h-4 text-brand-blue bg-gray-800 border-gray-700 rounded focus:ring-brand-blue focus:ring-2"
                  />
                  <label htmlFor="remind" className="ml-2 text-sm font-medium text-gray-300">
                    Enable Reminder
                  </label>
                </div>

                {newHabit.reminder.enabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Reminder Time
                    </label>
                    <input
                      type="datetime-local"
                      value={newHabit.reminder.time}
                      onChange={(e) => setNewHabit({ ...newHabit, reminder: { ...newHabit.reminder, time: e.target.value } })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                      required={newHabit.reminder.enabled}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Tags
                </label>
                <div className="min-h-[40px] p-2 bg-gray-800 border border-gray-700 rounded-lg mb-2">
                  <div className="flex flex-wrap gap-2">
                    {newHabit.tags.map(tag => (
                      <span 
                        key={tag} 
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all ${getTagColor(tag)} animate-fadeIn`}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-white transition-colors duration-200"
                          aria-label={`Remove ${tag} tag`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {topTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        if (!newHabit.tags.includes(tag.name)) {
                          setNewHabit(prev => ({
                            ...prev,
                            tags: [...prev.tags, tag.name]
                          }));
                        }
                      }}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        newHabit.tags.includes(tag.name)
                          ? 'bg-brand-blue/20 text-brand-blue ring-2 ring-brand-blue'
                          : `${getTagColor(tag.name)} hover:ring-2 hover:ring-white/50`
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowTagManager(true)}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-700 hover:bg-gray-600 transition-all"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Manage Tags
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    placeholder="Type a tag and press Enter"
                  />
                  {tagInput && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      Press Enter to add
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddHabit(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-opacity-90 shadow-[0_0_15px_rgba(29,99,255,0.5)] hover:shadow-[0_0_20px_rgba(29,99,255,0.7)] transition-all duration-300"
                >
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Habit Modal */}
      {showEditHabit && editingHabit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/90 rounded-xl p-6 w-full max-w-md m-4 shadow-xl border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Edit Habit</h2>
              <button
                onClick={() => {
                  setShowEditHabit(false);
                  setEditingHabit(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateHabit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={editingHabit.title}
                  onChange={(e) => setEditingHabit({ ...editingHabit, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="e.g., Morning Meditation"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editingHabit.content}
                  onChange={(e) => setEditingHabit({ ...editingHabit, content: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Describe your habit..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Period
                </label>
                <select
                  value={editingHabit.period}
                  onChange={(e) => setEditingHabit({ ...editingHabit, period: e.target.value as PeriodType })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="remind-edit"
                    checked={editingHabit.reminder?.enabled}
                    onChange={(e) => setEditingHabit({ 
                      ...editingHabit, 
                      reminder: { 
                        ...editingHabit.reminder, 
                        enabled: editingHabit.reminder?.enabled ?? false,
                        time: e.target.value 
                      } 
                    })}
                    className="w-4 h-4 text-brand-blue bg-gray-800 border-gray-700 rounded focus:ring-brand-blue focus:ring-2"
                  />
                  <label htmlFor="remind-edit" className="ml-2 text-sm font-medium text-gray-300">
                    Enable Reminder
                  </label>
                </div>

                {editingHabit.reminder?.enabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Reminder Time
                    </label>
                    <input
                      type="datetime-local"
                      value={editingHabit.reminder.time}
                      onChange={(e) => setEditingHabit({ 
                        ...editingHabit, 
                        reminder: { 
                          ...editingHabit.reminder, 
                          enabled: editingHabit.reminder?.enabled ?? false,
                          time: e.target.value 
                        } 
                      })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                      required={editingHabit.reminder.enabled}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editingHabit.tags?.map(tag => (
                    <span 
                      key={tag.id} 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getTagColor(tag.name)}`}
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveEditTag(tag)}
                        className="ml-1.5 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={handleAddEditTag}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Type a tag and press Enter"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => handleDeleteHabit(editingHabit.id)}
                  className="flex-1 px-4 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete Habit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditHabit(false);
                    setEditingHabit(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-opacity-90 shadow-[0_0_15px_rgba(29,99,255,0.5)] hover:shadow-[0_0_20px_rgba(29,99,255,0.7)] transition-all duration-300"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tag Manager Modal */}
      {showTagManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/90 rounded-xl p-6 w-full max-w-md m-4 shadow-xl border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Manage Tags</h2>
              <button
                onClick={() => setShowTagManager(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {topTags.map(tag => (
                  <div
                    key={tag.id}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getTagColor(tag.name)}`}
                  >
                    {tag.name}
                    <button
                      onClick={async () => {
                        await supabase
                          .from('tags')
                          .delete()
                          .eq('name', tag.name)
                          .eq('user_id', user?.id);
                        loadTopTags();
                      }}
                      className="hover:text-white transition-colors duration-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault();
                      const newTag = {
                        name: tagInput.trim(),
                        user_id: user?.id,
                        createdat: new Date().toISOString()
                      };
                      await supabase.from('tags').insert([newTag]);
                      setTagInput('');
                      loadTopTags();
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Add a new tag and press Enter"
                />
                {tagInput && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    Press Enter to add
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 