"use client";
import React, { useEffect, useState, useCallback, memo } from 'react';

function UpcomingReminders({ refreshTrigger }) {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReminders = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/dashboard/reminders');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setReminders(data || []);
        } catch (err) {
            console.error('Error fetching reminders:', err);
            setReminders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReminders();
    }, [fetchReminders, refreshTrigger]);

    if (loading) {
        return (
            <div className="card bg-base-100 shadow-xl mb-4 border-l-4 border-primary">
                <div className="card-body p-3 md:p-4">
                    <div className="flex items-center gap-2">
                        <span className="loading loading-spinner loading-sm"></span>
                        <span className="text-xs md:text-sm uppercase text-gray-500">Loading reminders...</span>
                    </div>
                </div>
            </div>
        );
    }
    if (!reminders || reminders.length === 0) return null;

    return (
        <div className="card bg-base-100 shadow-xl mb-4 border-l-4 border-primary">
            <div className="card-body p-3 md:p-4">
                <h3 className="card-title text-xs md:text-sm uppercase text-gray-500 mb-2">Upcoming Reminders</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    {reminders.map(r => (
                        <div key={r.id} className="flex justify-between items-center bg-base-200 p-2 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col items-center bg-white dark:bg-gray-700 p-1 rounded border border-gray-200 dark:border-gray-600 w-10">
                                    <span className="text-[10px] uppercase text-error font-bold">{new Date(r.date).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{new Date(r.date).getDate()}</span>
                                </div>
                                <div>
                                    <div className="font-bold text-sm bg-base-100 px-2 py-0.5 rounded-full inline-block mb-1" style={{ borderLeft: `3px solid ${r.color}` }}>
                                        {r.category_name} {r.subcategory_name ? `/ ${r.subcategory_name}` : ''}
                                    </div>
                                    <div className="text-xs opacity-70">
                                        Remaining: <span className="font-mono font-bold">{r.remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} ֏</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default memo(UpcomingReminders);
