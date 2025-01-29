'use client';

import { ThemeToggle } from "@/components/ThemeToggle"
import { useState, useEffect } from "react"
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useAccount, useSignMessage } from 'wagmi';

interface UserData {
  id: string;
  name: string;
  email: string | null;
  wallet_address: string | null;
}

export default function SettingsPage() {
  const { isCollapsed } = useSidebar();
  const { user, signOut } = useAuth();
  const { address } = useAccount();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState({
    weeklySummary: false,
    achievements: false
  });

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;
      
      // First try to get the user
      const { data: existingUser, error: fetchError } = await supabase
        .from('User')
        .select('name, wallet_address')
        .eq('id', user.id)
        .single();

      if (!existingUser) {
        // If user doesn't exist, create them
        let defaultName = '';
        
        // For email users, use the part before @ as initial name
        if (user.email) {
          defaultName = user.email.split('@')[0];
        }
        // For wallet users, use a shortened version of their address
        else if (address) {
          defaultName = `${address.slice(0, 6)}...${address.slice(-4)}`;
        }

        const { data: newUser, error: insertError } = await supabase
          .from('User')
          .insert([
            { 
              id: user.id,
              email: user.email,
              wallet_address: address,
              name: defaultName
            }
          ])
          .select()
          .single();

        if (newUser) {
          setName(newUser.name);
        }
      } else {
        // Update wallet address if it changed
        if (address && existingUser.wallet_address !== address) {
          await supabase
            .from('User')
            .update({ wallet_address: address })
            .eq('id', user.id);
        }
        setName(existingUser.name || '');
      }
    };

    loadUserData();
  }, [user?.id, user?.email, address]);

  const handleSaveChanges = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('User')
        .update({ 
          name,
          wallet_address: address
        })
        .eq('id', user.id);

      if (error) throw error;
      
      console.log('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    if (!showDeleteWarning) {
      setShowDeleteWarning(true);
      return;
    }

    setIsDeleting(true);
    try {
      // Delete user data from all related tables
      const { error: deleteError } = await supabase
        .from('User')
        .delete()
        .eq('id', user.id);

      if (deleteError) throw deleteError;

      // Sign out the user
      await signOut();
      window.location.href = '/'; // Redirect to home page
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteWarning(false);
    }
  };

  const handleExportData = async () => {
    if (!user?.id) {
      console.error('No user ID found');
      alert('Please log in to export your data');
      return;
    }

    try {
      console.log('Starting data export for user:', user.id);

      // Fetch all entries (both habits and journal entries)
      const { data: entriesData, error: entriesError } = await supabase
        .from('entries')
        .select('id, title, content, type, frequency, created_at')
        .eq('user_id', user.id);

      if (entriesError) {
        console.error('Error fetching entries:', entriesError);
        throw entriesError;
      }

      console.log('Successfully fetched entries:', entriesData?.length || 0);

      // Separate habits and journal entries
      const habitData = entriesData?.filter(entry => entry.type === 'habit') || [];
      const journalData = entriesData?.filter(entry => entry.type === 'journal') || [];

      // Convert habits to CSV
      if (habitData && habitData.length > 0) {
        const habitHeaders = ['ID', 'Title', 'Content', 'Frequency', 'Created At'].join(',');
        const habitRows = habitData.map(habit => [
          habit.id,
          `"${(habit.title || '').replace(/"/g, '""')}"`,
          `"${(habit.content || '').replace(/"/g, '""')}"`,
          habit.frequency,
          habit.created_at
        ].join(','));
        const habitCsv = [habitHeaders, ...habitRows].join('\n');

        // Download habits CSV
        const habitBlob = new Blob([habitCsv], { type: 'text/csv' });
        const habitUrl = window.URL.createObjectURL(habitBlob);
        const habitLink = document.createElement('a');
        habitLink.href = habitUrl;
        habitLink.download = `habits-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(habitLink);
        habitLink.click();
        window.URL.revokeObjectURL(habitUrl);
        document.body.removeChild(habitLink);
      }

      // Convert journals to CSV
      if (journalData && journalData.length > 0) {
        const journalHeaders = ['ID', 'Title', 'Content', 'Created At'].join(',');
        const journalRows = journalData.map(journal => [
          journal.id,
          `"${(journal.title || '').replace(/"/g, '""')}"`,
          `"${(journal.content || '').replace(/"/g, '""')}"`,
          journal.created_at
        ].join(','));
        const journalCsv = [journalHeaders, ...journalRows].join('\n');

        // Download journals CSV
        const journalBlob = new Blob([journalCsv], { type: 'text/csv' });
        const journalUrl = window.URL.createObjectURL(journalBlob);
        const journalLink = document.createElement('a');
        journalLink.href = journalUrl;
        journalLink.download = `journals-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(journalLink);
        journalLink.click();
        window.URL.revokeObjectURL(journalUrl);
        document.body.removeChild(journalLink);
      }

      // Show success message
      alert('Your data has been exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please check the console for more details.');
    }
  };

  const handleEmailNotificationChange = (type: 'weeklySummary' | 'achievements') => {
    setEmailNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  return (
    <div className={`${!isCollapsed ? 'ml-[20px]' : 'ml-20'} transition-all duration-300`}>
      <div className="p-6">
        <div className="max-w-4xl space-y-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences.</p>
          </div>

          <div className="grid gap-6">
            {/* Account Settings */}
            <section className="bg-background rounded-lg border shadow-sm p-6">
              <h2 className="text-2xl font-semibold mb-4">Account Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-background border rounded-md"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-background border rounded-md"
                    placeholder="Your email"
                    value={user?.email || ''}
                    disabled
                  />
                </div>
                <div className="flex justify-between pt-4">
                  <div className="flex gap-2">
                    <button 
                      className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 ${
                        showDeleteWarning 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : showDeleteWarning ? 'Are you sure? Click again if you are' : 'Delete Account'}
                    </button>
                    {showDeleteWarning && (
                      <button 
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                        onClick={() => setShowDeleteWarning(false)}
                      >
                        Nevermind
                      </button>
                    )}
                  </div>
                  <button 
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors disabled:opacity-50"
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </section>

            {/* Privacy & Security */}
            <section className="bg-background rounded-lg border shadow-sm p-6">
              <h2 className="text-2xl font-semibold mb-4">Privacy & Security</h2>
              <div className="space-y-4">
                <button 
                  className="px-4 py-2 border hover:bg-accent rounded-md transition-colors"
                  onClick={handleExportData}
                >
                  Export Your Data
                </button>
                <div>
                  <label className="block text-sm font-medium mb-1">Email Notifications</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={emailNotifications.weeklySummary}
                        onChange={() => handleEmailNotificationChange('weeklySummary')}
                      />
                      <span>Receive weekly summaries</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={emailNotifications.achievements}
                        onChange={() => handleEmailNotificationChange('achievements')}
                      />
                      <span>Receive achievement notifications</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
} 