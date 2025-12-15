"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

export default function DueRemindersModal({ reminders }) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!reminders || reminders.length === 0) return;

        // Check if modal has been shown in this session
        const modalShown = sessionStorage.getItem('dueRemindersModalShown');
        if (modalShown === 'true') return;

        // Check if any reminders are due (today or in the past)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to start of day

        const dueReminders = reminders.filter(r => {
            const reminderDate = new Date(r.date);
            reminderDate.setHours(0, 0, 0, 0);
            return reminderDate <= today;
        });

        if (dueReminders.length > 0) {
            setIsOpen(true);
            // Mark as shown in this session
            sessionStorage.setItem('dueRemindersModalShown', 'true');
        }
    }, [reminders]);

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleGoToPlanning = () => {
        router.push('/planning');
        handleClose();
    };

    if (!isOpen || !reminders || reminders.length === 0) return null;

    // Filter reminders that are due (today or in the past)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueReminders = reminders.filter(r => {
        const reminderDate = new Date(r.date);
        reminderDate.setHours(0, 0, 0, 0);
        return reminderDate <= today;
    });

    if (dueReminders.length === 0) return null;

    // Format date as DD-MMM-YYYY (e.g., 12-Dec-2025)
    const formatReminderDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[d.getMonth()];
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const modalContent = (
        <dialog className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
            <div className="modal-box max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Payment Reminder
                </h3>
                <p className="text-base-content/70 mb-4">
                    You have {dueReminders.length} reminder{dueReminders.length > 1 ? 's' : ''} that {dueReminders.length > 1 ? 'are' : 'is'} due today or overdue:
                </p>
                <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                    {dueReminders.map(r => {
                        const reminderDate = new Date(r.date);
                        const isOverdue = reminderDate < today;
                        return (
                            <div key={r.id} className={`p-3 rounded-lg border-l-4 ${isOverdue ? 'bg-error/10 border-error' : 'bg-warning/10 border-warning'}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div 
                                                className="w-3 h-3 rounded-full" 
                                                style={{ backgroundColor: r.color }}
                                            ></div>
                                            <span className="font-bold text-sm">
                                                {r.category_name} {r.subcategory_name ? `/ ${r.subcategory_name}` : ''}
                                            </span>
                                        </div>
                                        <div className="text-xs text-base-content/70">
                                            <div>Reminder Date: {formatReminderDate(reminderDate)}</div>
                                            <div className="font-mono font-semibold mt-1">
                                                Remaining: {r.remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} ֏
                                            </div>
                                        </div>
                                    </div>
                                    {isOverdue && (
                                        <span className="badge badge-error badge-sm">Overdue</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={handleClose}>
                        Dismiss
                    </button>
                    <button className="btn btn-primary" onClick={handleGoToPlanning}>
                        Go to Planning
                    </button>
                </div>
            </div>
        </dialog>
    );

    if (typeof window !== 'undefined') {
        return createPortal(modalContent, document.body);
    }
    return null;
}

