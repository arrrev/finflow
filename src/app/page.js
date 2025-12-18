"use client";
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import TransactionForm from '@/components/TransactionForm';
import Analytics from '@/components/Analytics';
// import TransactionList removed
import UpcomingReminders from '@/components/UpcomingReminders';
import OnboardingWizard from '@/components/OnboardingWizard';
import DueRemindersModal from '@/components/DueRemindersModal';
import { useSession } from 'next-auth/react';
import { createPortal } from 'react-dom';

export default function Dashboard() {
  const { data: session, status } = useSession();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [reminders, setReminders] = useState([]);
  const userIdRef = useRef(null);
  const hasFetchedRef = useRef(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

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
        {/* Mobile: Add Transaction Button */}
        <div className="md:hidden mt-4 sm:mt-6">
          <button 
            className="btn btn-success w-full h-12 text-base font-semibold shadow-lg" 
            onClick={() => setCreateModalOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Transaction
          </button>
        </div>

        {/* Top Input Section */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          <div className="hidden md:block w-full md:w-1/3">
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

      {/* Create Transaction Modal */}
      {createModalOpen && (typeof window !== 'undefined' ? createPortal(
        <div className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) setCreateModalOpen(false); }}>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            style={{ zIndex: 99998 }}
            onClick={(e) => { if (e.target === e.currentTarget) setCreateModalOpen(false); }}
          />
          <div 
            className="modal-box w-full max-w-2xl h-full max-h-screen rounded-none sm:rounded-2xl m-0 sm:m-4 p-0 relative overflow-hidden flex flex-col" 
            style={{ zIndex: 99999 }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-base-100 z-10 border-b border-base-300 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center flex-shrink-0">
              <h3 className="font-bold text-base sm:text-lg">Create Transaction</h3>
              <button 
                className="btn btn-sm btn-circle btn-ghost" 
                onClick={() => setCreateModalOpen(false)}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <TransactionForm 
                onSuccess={() => {
                  setCreateModalOpen(false);
                  handleRefresh();
                }} 
                hideTitle={true}
              />
            </div>
          </div>
        </div>,
        document.body
      ) : null)}
    </>
  );
}
