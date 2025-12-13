"use client";
import React, { useState, useCallback } from 'react';
import TransactionForm from '@/components/TransactionForm';
import Analytics from '@/components/Analytics';
// import TransactionList removed
import UpcomingReminders from '@/components/UpcomingReminders';
import OnboardingWizard from '@/components/OnboardingWizard';
import { useSession } from 'next-auth/react';

export default function Dashboard() {
  const { data: session, status } = useSession();

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  if (status === 'loading') return <div className="p-10 text-center"><span className="loading loading-dots loading-lg"></span></div>;
  if (!session) return null;

  return (
    <>
      <OnboardingWizard />
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
