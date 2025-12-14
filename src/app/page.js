"use client";
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import TransactionForm from '@/components/TransactionForm';
import Analytics from '@/components/Analytics';
// import TransactionList removed
import UpcomingReminders from '@/components/UpcomingReminders';
import OnboardingWizard from '@/components/OnboardingWizard';
import DueRemindersModal from '@/components/DueRemindersModal';
import { useSession } from 'next-auth/react';

export default function Dashboard() {
  const { data: session, status } = useSession();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [reminders, setReminders] = useState([]);
  const userIdRef = useRef(null);
  const hasFetchedRef = useRef(false);

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => session?.user?.id, [session?.user?.id]);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Fetch reminders for the modal - only once on mount or when refreshTrigger changes
  useEffect(() => {
    if (status === 'authenticated' && userId) {
      // Only fetch if user ID changed or refreshTrigger changed, not on every session update
      const shouldFetch = userIdRef.current !== userId || (refreshTrigger > 0 && hasFetchedRef.current);
      
      if (shouldFetch) {
        if (userIdRef.current !== userId) {
          userIdRef.current = userId;
          hasFetchedRef.current = false; // Reset on user change
        }
        hasFetchedRef.current = true;
        
        fetch('/api/dashboard/reminders')
          .then(res => res.ok ? res.json() : [])
          .then(data => setReminders(data || []))
          .catch(() => setReminders([]));
      }
    }
  }, [status, userId, refreshTrigger]);

  // Memoize child components props to prevent re-renders
  const memoizedReminders = useMemo(() => reminders, [reminders]);

  if (status === 'loading') return <div className="pt-24 sm:pt-32 p-10 text-center"><span className="loading loading-dots loading-lg"></span></div>;
  if (!session) return null;

  // Memoize components to prevent re-renders when session object reference changes
  return (
    <>
      <OnboardingWizard />
      <DueRemindersModal reminders={memoizedReminders} />
      <div className="space-y-3 md:space-y-8">
        {/* Top Input Section */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          <div className="w-full md:w-1/3">
            <TransactionForm
              onSuccess={handleRefresh}
            />
          </div>

          {/* Right Section: Tabs and Content */}
          <div className="w-full md:w-2/3 space-y-4">
            <UpcomingReminders refreshTrigger={refreshTrigger} />
            <Analytics refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
          </div>
        </div>
      </div>
    </>
  );
}
