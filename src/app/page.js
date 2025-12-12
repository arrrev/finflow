"use client";
import React, { useState, useEffect } from 'react';
import TransactionForm from '@/components/TransactionForm';
import Analytics from '@/components/Analytics';
import TransactionList from '@/components/TransactionList';
import UpcomingReminders from '@/components/UpcomingReminders';
import { useSession } from 'next-auth/react';

export default function Dashboard() {
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' or 'list'
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (status === 'loading') return <div className="p-10 text-center"><span className="loading loading-dots loading-lg"></span></div>;
  if (!session) return null;

  return (
    <div className="space-y-8">
      {/* Top Input Section */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <TransactionForm
            onSuccess={handleRefresh}
          />
        </div>

        {/* Right Section: Tabs and Content */}
        <div className="md:w-2/3 space-y-4">
          <UpcomingReminders />

          <div role="tablist" className="tabs tabs-boxed">
            <a
              role="tab"
              className={`tab ${activeTab === 'analytics' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </a>
            <a
              role="tab"
              className={`tab ${activeTab === 'list' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              Transactions List
            </a>
          </div>

          {activeTab === 'analytics' && (
            // Analytics component now handles its own fetching and view controls
            <Analytics key={refreshKey} />
          )}

          {activeTab === 'list' && (
            <TransactionList key={refreshKey} />
          )}
        </div>
      </div>
    </div>
  );
}
