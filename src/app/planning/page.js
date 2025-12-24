"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useToaster } from '@/components/Toaster';
import CustomSelect from '@/components/CustomSelect';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomMonthPicker from '@/components/CustomMonthPicker';
import CustomYearPicker from '@/components/CustomYearPicker';
import { formatDate, getCurrencySymbol } from '@/lib/utils';

export default function PlanningPage() {
    const { success, error } = useToaster();
    const isSubmittingRef = useRef(false);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [plans, setPlans] = useState([]);
    const [yearPlans, setYearPlans] = useState({}); // { "YYYY-MM": [plans] }
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userMainCurrency, setUserMainCurrency] = useState('USD');
    const [viewMode, setViewMode] = useState('year'); // 'month' or 'year'

    const [form, setForm] = useState({ 
        month: month,
        categoryId: '', 
        subcategoryId: '', 
        amount: '',
        reminder_date: '',
        frequency: '' // 'monthly', 'yearly', 'quarterly', 'bi-monthly'
    });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [copyFromMonth, setCopyFromMonth] = useState('');
    const [type, setType] = useState('expense'); // 'expense' or 'income'

    const fetchPlans = useCallback(() => {
        setLoading(true);
        fetch(`/api/plans?month=${month}`)
            .then(res => res.json())
            .then(data => {
                setPlans(data);
                setLoading(false);
            });
    }, [month]);

    const fetchYearPlans = useCallback(async () => {
        setLoading(true);
        const yearPlansData = {};
        const months = Array.from({ length: 12 }, (_, i) => {
            const monthNum = String(i + 1).padStart(2, '0');
            return `${year}-${monthNum}`;
        });

        try {
            const promises = months.map(monthKey => 
                fetch(`/api/plans?month=${monthKey}`)
                    .then(res => res.json())
                    .then(data => ({ month: monthKey, plans: data }))
            );
            const results = await Promise.all(promises);
            results.forEach(({ month, plans }) => {
                yearPlansData[month] = plans;
            });
            setYearPlans(yearPlansData);
            setLoading(false);
        } catch (e) {
            error('Error fetching year plans');
            setLoading(false);
        }
    }, [year, error]);

    useEffect(() => {
        // Load categories once
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data));
        
        // Fetch user preferences for main currency
        fetch('/api/user/preferences')
            .then(res => res.json())
            .then(prefs => {
                if (prefs.main_currency) {
                    setUserMainCurrency(prefs.main_currency);
                }
            })
            .catch(err => console.error('Error fetching user preferences:', err));
    }, []);

    useEffect(() => {
        if (viewMode === 'month') {
            fetchPlans();
        } else {
            fetchYearPlans();
        }
    }, [viewMode, fetchPlans, fetchYearPlans]);

    const handleAddPlan = async (e) => {
        e.preventDefault();
        
        // Prevent duplicate submissions
        if (isSubmittingRef.current) {
            return;
        }
        
        if (!form.categoryId) {
            error('Please select a category');
            return;
        }
        if (!form.amount || form.amount === '-' || parseFloat(form.amount) === 0) {
            error('Please enter a valid amount');
            return;
        }
        
        isSubmittingRef.current = true;
        try {

            let finalAmount = Math.round(parseFloat(form.amount) || 0);
            // Only apply type-based conversion if amount is positive
            // If user enters negative directly, respect it
            if (finalAmount > 0) {
                if (type === 'expense') finalAmount = -finalAmount;
            } else if (finalAmount < 0 && type === 'income') {
                // If user enters negative for income, convert to positive
                finalAmount = Math.abs(finalAmount);
            }

            // Generate months based on frequency
            const monthsToCreate = generateMonthsForFrequency(form.month, form.frequency);
            
            // Create plans for all generated months
            let successCount = 0;
            let errorCount = 0;
            
            for (const monthKey of monthsToCreate) {
                try {
                    // Adjust reminder_date for each month if it exists
                    let adjustedReminderDate = null;
                    if (form.reminder_date) {
                        const [year, monthNum] = monthKey.split('-').map(Number);
                        
                        // Extract the day from the original reminder_date
                        let reminderDay;
                        if (form.reminder_date.includes('T')) {
                            // Handle ISO date string with time
                            const reminderDate = new Date(form.reminder_date);
                            reminderDay = reminderDate.getDate();
                        } else if (form.reminder_date.match(/^\d{4}-\d{2}-\d{2}/)) {
                            // Handle YYYY-MM-DD format
                            const parts = form.reminder_date.split('-');
                            reminderDay = parseInt(parts[2], 10);
                        } else {
                            // Try to parse as date
                            const reminderDate = new Date(form.reminder_date);
                            reminderDay = reminderDate.getDate();
                        }
                        
                        // Use the same day of month, but adjust if it doesn't exist in target month
                        // (e.g., Feb 30 -> Feb 28/29, or Jan 31 -> Feb 28/29)
                        const lastDayOfMonth = new Date(year, monthNum, 0).getDate();
                        const adjustedDay = Math.min(reminderDay, lastDayOfMonth);
                        adjustedReminderDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(adjustedDay).padStart(2, '0')}`;
                    }

                    const res = await fetch('/api/plans', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            month: monthKey,
                            category_id: form.categoryId,
                            subcategory_id: form.subcategoryId || null,
                            amount: finalAmount,
                            reminder_date: adjustedReminderDate || null
                        })
                    });
                    if (res.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (err) {
                    console.error(`Error creating plan for ${monthKey}:`, err);
                    errorCount++;
                }
            }

            if (errorCount > 0) {
                error(`Created ${successCount} plans, ${errorCount} failed`);
            } else {
                success(`Created ${successCount} plan${successCount !== 1 ? 's' : ''}`);
            }
            
            setIsCreateModalOpen(false);
            setForm({ month: viewMode === 'month' ? month : `${year}-01`, categoryId: '', subcategoryId: '', amount: '', reminder_date: '', frequency: '' });
            if (viewMode === 'month') {
                fetchPlans();
            } else {
                fetchYearPlans();
            }
        } catch (e) {
            console.error('Error adding plan:', e);
            error(e.message || 'Error adding plan');
        } finally {
            isSubmittingRef.current = false;
            setSubmitting(false);
        }
    };

    // Generate months for the next 3 years based on frequency
    const generateMonthsForFrequency = (startMonth, frequency) => {
        if (!frequency || frequency === '') {
            // No frequency selected, just return the single month
            return [startMonth];
        }

        const [startYear, startMonthNum] = startMonth.split('-').map(Number);
        const months = [startMonth];
        const endYear = startYear + 3;
        
        let currentYear = startYear;
        let currentMonth = startMonthNum;
        let monthIncrement = 1;

        switch (frequency) {
            case 'monthly':
                monthIncrement = 1;
                break;
            case 'bi-monthly':
                monthIncrement = 2;
                break;
            case 'quarterly':
                monthIncrement = 3;
                break;
            case 'yearly':
                monthIncrement = 12;
                break;
            default:
                return [startMonth];
        }

        // Generate months until we reach 3 years from start (exclusive)
        while (true) {
            currentMonth += monthIncrement;
            
            // Handle month overflow
            while (currentMonth > 12) {
                currentMonth -= 12;
                currentYear += 1;
            }

            // Stop if we've exceeded 3 years from start
            if (currentYear > endYear || (currentYear === endYear && currentMonth > startMonthNum)) {
                break;
            }

            const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
            months.push(monthKey);
        }

        return months;
    };

    const [filterCategory, setFilterCategory] = useState('');
    const [sortField, setSortField] = useState('category_name');
    const [sortOrder, setSortOrder] = useState('ASC');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [reminderModal, setReminderModal] = useState({ isOpen: false, plan: null, month: '' });
    const [confirmAction, setConfirmAction] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [editingCell, setEditingCell] = useState(null);
    const [editValue, setEditValue] = useState('');

    // Handle ESC key for modals
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                if (isCreateModalOpen) setIsCreateModalOpen(false);
                if (isEditModalOpen) setIsEditModalOpen(false);
                if (reminderModal.isOpen) setReminderModal({ isOpen: false, plan: null, month: '' });
                if (confirmAction.isOpen) setConfirmAction({ ...confirmAction, isOpen: false });
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isCreateModalOpen, isEditModalOpen, reminderModal.isOpen, confirmAction.isOpen]);

    const filteredPlans = plans.filter(p => {
        if (filterCategory && p.category_id != filterCategory) return false;
        return true;
    }).sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Handle numeric
        if (sortField === 'amount') {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
        } else {
            aVal = (aVal || '').toString().toLowerCase();
            bVal = (bVal || '').toString().toLowerCase();
        }

        if (aVal < bVal) return sortOrder === 'ASC' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'ASC' ? 1 : -1;
        return 0;
    });

    const handleSort = (field) => {
        if (sortField === field) setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        else { setSortField(field); setSortOrder('ASC'); }
    };

    const openEditModal = (plan) => {
        setEditingPlan({
            ...plan,
            amount: plan.amount ? String(Math.round(parseFloat(plan.amount) || 0)) : ''
        });
        setIsEditModalOpen(true);
    };

    const handleUpdatePlan = async (e) => {
        e.preventDefault();
        
        // Prevent duplicate submissions
        if (isSubmittingRef.current) {
            return;
        }
        
        isSubmittingRef.current = true;
        setSubmitting(true);
        try {
            const res = await fetch('/api/plans', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingPlan)
            });
            if (!res.ok) throw new Error('Failed');
            success('Plan updated');
            setIsEditModalOpen(false);
            setEditingPlan(null);
            if (viewMode === 'month') {
                fetchPlans();
            } else {
                fetchYearPlans();
            }
        } catch (e) {
            error('Error updating plan');
        } finally {
            isSubmittingRef.current = false;
            setSubmitting(false);
        }
    };

    const handleInlineUpdate = async (planId, newAmount, planMonth) => {
        try {
            const res = await fetch('/api/plans', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: planId, amount: Math.round(parseFloat(newAmount) || 0) })
            });
            if (!res.ok) throw new Error('Failed');
            success('Plan updated');
            if (viewMode === 'month') {
                fetchPlans();
            } else {
                fetchYearPlans();
            }
        } catch (e) {
            error('Error updating plan');
        }
    };

    const handleInlineCreate = async (categoryId, subcategoryId, monthKey, amount) => {
        try {
            const res = await fetch('/api/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    month: monthKey,
                    category_id: categoryId,
                    subcategory_id: subcategoryId || null,
                    amount: Math.round(parseFloat(amount) || 0)
                })
            });
            if (!res.ok) throw new Error('Failed');
            success('Plan created');
            fetchYearPlans();
        } catch (e) {
            error('Error creating plan');
        }
    };

    const handleReminderUpdate = async (planId, reminderDate, planMonth) => {
        try {
            const res = await fetch('/api/plans', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: planId, reminder_date: reminderDate || null })
            });
            if (!res.ok) throw new Error('Failed');
            success('Reminder updated');
            setReminderModal({ isOpen: false, plan: null, month: '' });
            if (viewMode === 'month') {
                fetchPlans();
            } else {
                fetchYearPlans();
            }
        } catch (e) {
            error('Error updating reminder');
        }
    };

    const confirmDelete = (id) => {
        setConfirmAction({
            isOpen: true,
            title: 'Delete Plan',
            message: 'Are you sure you want to delete this plan?',
            onConfirm: () => handleDeletePlan(id)
        });
    };

    const handleDeletePlan = async (id) => {
        try {
            const res = await fetch(`/api/plans?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            success('Plan deleted');
            setConfirmAction({ isOpen: false });
            if (viewMode === 'month') {
                fetchPlans();
            } else {
                fetchYearPlans();
            }
        } catch (e) {
            error('Error deleting plan');
        }
    };

    const handleCopyPlans = async (e) => {
        e.preventDefault();
        
        // Prevent duplicate submissions
        if (isSubmittingRef.current) {
            return;
        }
        
        if (!copyFromMonth) {
            error('Please select a month to copy from');
            return;
        }
        if (copyFromMonth === month) {
            error('Cannot copy from the same month');
            return;
        }
        
        isSubmittingRef.current = true;
        setSubmitting(true);
        try {
            const res = await fetch('/api/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'copy',
                    fromMonth: copyFromMonth,
                    toMonth: month
                })
            });
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            success(`Copied ${data.count || 0} plans from ${copyFromMonth}`);
            setIsCopyModalOpen(false);
            setCopyFromMonth('');
            fetchPlans();
        } catch (e) {
            error('Error copying plans');
        } finally {
            isSubmittingRef.current = false;
            setSubmitting(false);
        }
    };

    const handleConfirm = () => {
        if (confirmAction.onConfirm) confirmAction.onConfirm();
    };

    const selectedCategory = categories.find(c => c.id == form.categoryId);

    // Calculate total sum
    const totalSum = filteredPlans.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    // Build year matrix data
    const buildYearMatrix = () => {
        const matrix = [];
        const months = Array.from({ length: 12 }, (_, i) => {
            const monthNum = String(i + 1).padStart(2, '0');
            return `${year}-${monthNum}`;
        });

        // Get all unique category-subcategory combinations
        const categorySubcatMap = new Map();
        months.forEach(monthKey => {
            const monthPlans = yearPlans[monthKey] || [];
            monthPlans.forEach(plan => {
                const key = `${plan.category_id}-${plan.subcategory_id || 'null'}`;
                if (!categorySubcatMap.has(key)) {
                    categorySubcatMap.set(key, {
                        category_id: plan.category_id,
                        category_name: plan.category_name,
                        category_color: plan.category_color,
                        subcategory_id: plan.subcategory_id,
                        subcategory_name: plan.subcategory_name
                    });
                }
            });
        });

        // Convert map to array and sort by category name, then subcategory name
        const sortedCategories = Array.from(categorySubcatMap.values()).sort((a, b) => {
            // First sort by category name (A-Z)
            const categoryCompare = (a.category_name || '').localeCompare(b.category_name || '', undefined, { sensitivity: 'base' });
            if (categoryCompare !== 0) return categoryCompare;
            
            // If same category, sort by subcategory name (A-Z)
            // null/undefined subcategories come first
            if (!a.subcategory_name && !b.subcategory_name) return 0;
            if (!a.subcategory_name) return -1;
            if (!b.subcategory_name) return 1;
            return (a.subcategory_name || '').localeCompare(b.subcategory_name || '', undefined, { sensitivity: 'base' });
        });

        // Build matrix rows in sorted order
        sortedCategories.forEach((catSubcat) => {
            const row = {
                ...catSubcat,
                months: {}
            };
            months.forEach(monthKey => {
                const monthPlans = yearPlans[monthKey] || [];
                const plan = monthPlans.find(p => 
                    p.category_id === catSubcat.category_id && 
                    (p.subcategory_id || null) === (catSubcat.subcategory_id || null)
                );
                row.months[monthKey] = plan || null;
            });
            matrix.push(row);
        });

        return { matrix, months };
    };

    const { matrix, months: yearMonths } = viewMode === 'year' ? buildYearMatrix() : { matrix: [], months: [] };

    // Calculate monthly totals for year view
    const calculateMonthlyTotals = () => {
        const totals = {};
        yearMonths.forEach(monthKey => {
            const monthPlans = yearPlans[monthKey] || [];
            const total = monthPlans.reduce((sum, plan) => sum + parseFloat(plan.amount || 0), 0);
            totals[monthKey] = total;
        });
        return totals;
    };

    const monthlyTotals = viewMode === 'year' ? calculateMonthlyTotals() : {};
    
    // Calculate year total for year view
    const yearTotal = viewMode === 'year' 
        ? Object.values(monthlyTotals).reduce((sum, total) => sum + total, 0)
        : 0;

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-4 md:p-6 relative">
                <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
                    <div>
                        <h2 className="card-title text-lg md:text-xl">{viewMode === 'year' ? 'Yearly Planning' : 'Monthly Planning'}</h2>
                        {viewMode === 'month' && (
                            <div className={`text-sm font-mono font-bold mt-1 ${totalSum < 0 ? 'text-error' : 'text-success'}`}>
                                Total: {getCurrencySymbol(userMainCurrency)} {Math.abs(totalSum).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                        )}
                        {viewMode === 'year' && (
                            <div className={`text-sm font-mono font-bold mt-1 ${yearTotal < 0 ? 'text-error' : 'text-success'}`}>
                                Year Total: {getCurrencySymbol(userMainCurrency)} {Math.abs(yearTotal).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <div className="join">
                            <button
                                className={`join-item btn btn-sm ${viewMode === 'month' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setViewMode('month')}
                            >
                                Month View
                            </button>
                            <button
                                className={`join-item btn btn-sm ${viewMode === 'year' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setViewMode('year')}
                            >
                                Year View
                            </button>
                        </div>
                    </div>
                </div>

                {/* Controls - Month filter next to category filter */}
                <div className="flex flex-col gap-3 mb-6">
                    <div className="flex flex-row gap-2 items-center text-sm">
                        <span className="whitespace-nowrap text-xs sm:text-sm">Filter:</span>
                        <div className="flex flex-row gap-2 items-center flex-1">
                            {viewMode === 'month' && (
                                <div className="w-40">
                                    <CustomMonthPicker
                                        value={month}
                                        onChange={setMonth}
                                        size="small"
                                    />
                                </div>
                            )}
                            {viewMode === 'year' && (
                                <div className="w-40">
                                    <CustomYearPicker
                                        value={year}
                                        onChange={setYear}
                                        size="small"
                                    />
                                </div>
                            )}
                            <div className="w-48">
                                <CustomSelect
                                    options={[{ value: '', label: 'All Categories' }, ...categories.map(c => ({ label: c.name, value: c.id, color: c.color }))]}
                                    value={filterCategory}
                                    onChange={(val) => setFilterCategory(val)}
                                    size="small"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <button 
                            onClick={() => {
                                setForm({ month: viewMode === 'month' ? month : `${year}-01`, categoryId: '', subcategoryId: '', amount: '', reminder_date: '', frequency: '' });
                                setIsCreateModalOpen(true);
                            }}
                            className="btn btn-primary btn-sm w-full sm:w-auto"
                        >
                            + Create Plan
                        </button>
                        {viewMode === 'month' && (
                            <button 
                                onClick={() => {
                                    setCopyFromMonth('');
                                    setIsCopyModalOpen(true);
                                }}
                                className="btn btn-outline btn-sm w-full sm:w-auto"
                            >
                                Copy
                            </button>
                        )}
                    </div>
                </div>

                {/* Month View */}
                {viewMode === 'month' && (
                    <>
                        {/* Plans List */}
                        <div className="space-y-4">
                            {loading && plans.length === 0 ? (
                                <div className="text-center py-20">
                                    <span className="loading loading-spinner loading-lg"></span>
                                </div>
                            ) : (
                                filteredPlans.map(p => {
                                const isExpense = Number(p.amount) < 0;
                                return (
                                    <div key={p.id} className="card bg-base-100 shadow-sm border border-base-200">
                                        <div className="card-body p-3">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between items-center gap-3">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.category_color || '#ccc' }}></div>
                                                        <div className="font-bold text-sm flex items-center gap-2 truncate">
                                                            {p.category_name}
                                                            {p.subcategory_name && (
                                                                <span className="opacity-80 text-sm font-semibold text-base-content/90">/ {p.subcategory_name}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <div className="text-right">
                                                            <div className={`text-lg font-mono font-bold ${isExpense ? 'text-error' : 'text-success'}`}>
                                                                {Number(p.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })} {getCurrencySymbol(userMainCurrency)}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => openEditModal(p)} className="btn btn-ghost btn-xs text-info p-1 min-h-0 h-6 w-6" title="Edit">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                                </svg>
                                                            </button>
                                                            <button onClick={() => confirmDelete(p.id)} className="btn btn-ghost btn-xs text-error p-1 min-h-0 h-6 w-6" title="Delete">✕</button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {p.reminder_date && (
                                                    <div className="text-xs badge badge-ghost badge-sm gap-1 w-fit">
                                                        <span>⏰</span>
                                                        {formatDate(p.reminder_date)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }))}
                            {!loading && filteredPlans.length === 0 && <div className="text-center opacity-50 py-10">No plans for this month</div>}
                        </div>
                    </>
                )}

                {/* Year View - Matrix Table */}
                {viewMode === 'year' && (
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]">
                        <table className="table table-zebra w-full">
                            <thead className="sticky top-0 z-20">
                                <tr>
                                    <th className="sticky left-0 bg-base-100 z-30">Category / Subcategory</th>
                                    {yearMonths.map(monthKey => {
                                        const [yearNum, monthNum] = monthKey.split('-');
                                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                        return (
                                            <th key={monthKey} className="text-center min-w-[120px] bg-base-100">
                                                {monthNames[parseInt(monthNum) - 1]}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && Object.keys(yearPlans).length === 0 ? (
                                    <tr>
                                        <td colSpan={13} className="text-center py-20">
                                            <span className="loading loading-spinner loading-lg"></span>
                                        </td>
                                    </tr>
                                ) : (
                                    matrix
                                        .filter(row => !filterCategory || row.category_id == filterCategory)
                                        .map((row, idx) => (
                                        <tr key={`${row.category_id}-${row.subcategory_id || 'null'}`}>
                                            <td className="sticky left-0 bg-base-100 z-10 border-r border-base-300">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.category_color || '#ccc' }}></div>
                                                    <div className="font-semibold text-sm">
                                                        {row.category_name}
                                                        {row.subcategory_name && (
                                                            <span className="opacity-70 text-xs"> / {row.subcategory_name}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {yearMonths.map(monthKey => {
                                                const plan = row.months[monthKey];
                                                const cellKey = `${row.category_id}-${row.subcategory_id || 'null'}-${monthKey}`;
                                                const isEditing = editingCell === cellKey;
                                                
                                                return (
                                                    <td key={monthKey} className="text-center p-1">
                                                        {isEditing ? (
                                                            <div className="flex flex-col gap-1">
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    className="input input-xs w-full text-center"
                                                                    value={editValue}
                                                                    onChange={(e) => {
                                                                        let val = e.target.value.replace(/[^0-9-]/g, ''); // Allow digits and minus
                                                                        // Ensure minus is only at the start
                                                                        if (val.includes('-')) {
                                                                            val = '-' + val.replace(/-/g, '');
                                                                        }
                                                                        setEditValue(val);
                                                                    }}
                                                                    onBlur={() => {
                                                                        if (editValue && editValue !== '') {
                                                                            if (plan) {
                                                                                handleInlineUpdate(plan.id, editValue, monthKey);
                                                                            } else {
                                                                                handleInlineCreate(row.category_id, row.subcategory_id, monthKey, editValue);
                                                                            }
                                                                        }
                                                                        setEditingCell(null);
                                                                        setEditValue('');
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            if (editValue && editValue !== '') {
                                                                                if (plan) {
                                                                                    handleInlineUpdate(plan.id, editValue, monthKey);
                                                                                } else {
                                                                                    handleInlineCreate(row.category_id, row.subcategory_id, monthKey, editValue);
                                                                                }
                                                                            }
                                                                            setEditingCell(null);
                                                                            setEditValue('');
                                                                        } else if (e.key === 'Escape') {
                                                                            setEditingCell(null);
                                                                            setEditValue('');
                                                                        }
                                                                    }}
                                                                    placeholder="Enter amount"
                                                                    autoFocus
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div 
                                                                className="flex flex-col items-center gap-1 cursor-pointer hover:bg-base-200 p-1 rounded"
                                                                onClick={() => {
                                                                    if (plan) {
                                                                        setEditValue(String(Math.round(parseFloat(plan.amount) || 0)));
                                                                    } else {
                                                                        setEditValue('');
                                                                    }
                                                                    setEditingCell(cellKey);
                                                                }}
                                                            >
                                                                {plan && Number(plan.amount) !== 0 ? (
                                                                    <>
                                                                        <div className={`text-sm font-mono ${Number(plan.amount) < 0 ? 'text-error' : 'text-success'}`}>
                                                                            {Number(plan.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                                        </div>
                                                                        {plan.reminder_date && (() => {
                                                                            // Extract day from reminder_date
                                                                            let day = '';
                                                                            try {
                                                                                const dateStr = plan.reminder_date;
                                                                                if (dateStr.includes('T')) {
                                                                                    const date = new Date(dateStr);
                                                                                    day = String(date.getDate());
                                                                                } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
                                                                                    day = dateStr.split('-')[2];
                                                                                } else {
                                                                                    const parts = dateStr.split('-');
                                                                                    if (parts.length >= 3) day = parts[2];
                                                                                }
                                                                            } catch (e) {
                                                                                // Fallback
                                                                            }
                                                                            return (
                                                                                <div className="flex items-center gap-1 justify-center">
                                                                                    <span className="text-xs" title={formatDate(plan.reminder_date)}>
                                                                                        ⏰ {day}
                                                                                    </span>
                                                                                    <button
                                                                                        className="btn btn-ghost btn-xs p-0.5 h-4 w-4 min-h-0 opacity-60 hover:opacity-100"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleReminderUpdate(plan.id, null, monthKey);
                                                                                        }}
                                                                                        title="Remove Reminder"
                                                                                    >
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                                                        </svg>
                                                                                    </button>
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </>
                                                                ) : (
                                                                    <span className="text-xs opacity-30">-</span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {plan && (
                                                            <button
                                                                className="btn btn-ghost btn-xs mt-1"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setReminderModal({ isOpen: true, plan, month: monthKey });
                                                                }}
                                                                title="Set/Change Reminder"
                                                            >
                                                                {plan.reminder_date ? '📅' : '⏰'}
                                                            </button>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                                {!loading && matrix.length === 0 && (
                                    <tr>
                                        <td colSpan={13} className="text-center opacity-50 py-10">
                                            No plans for this year
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="bg-base-200 font-bold">
                                    <td className="sticky left-0 bg-base-200 z-10">
                                        <div className="font-semibold">Total</div>
                                    </td>
                                    {yearMonths.map(monthKey => {
                                        const total = monthlyTotals[monthKey] || 0;
                                        return (
                                            <td key={monthKey} className="text-center p-2">
                                                <div className={`text-sm font-mono font-bold ${total < 0 ? 'text-error' : 'text-success'}`}>
                                                    {total > 0 ? '+' : ''}
                                                    {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
                </>

                {/* Create Plan Modal */}
                {isCreateModalOpen && (typeof window !== 'undefined' ? createPortal(
                    <div className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) setIsCreateModalOpen(false); }}>
                        <div 
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                            style={{ zIndex: 99998 }}
                            onClick={(e) => { if (e.target === e.currentTarget) setIsCreateModalOpen(false); }}
                        />
                        <div className="modal-box w-11/12 max-w-4xl max-h-[90vh] relative p-0 flex flex-col overflow-hidden" style={{ zIndex: 99999 }} onClick={(e) => e.stopPropagation()}>
                            <div className="sticky top-0 bg-base-100 z-10 border-b border-base-300 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center flex-shrink-0">
                                <h3 className="font-bold text-lg">Create Plan</h3>
                                <button 
                                    className="btn btn-sm btn-circle btn-ghost" 
                                    onClick={() => setIsCreateModalOpen(false)}
                                    aria-label="Close"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
                                <form onSubmit={handleAddPlan} className="flex flex-col gap-3 md:gap-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                        {/* Row 1: Month, Reminder Date */}
                                        <div className="form-control overflow-visible">
                                            <label className="label py-1">
                                                <span className="label-text">Month</span>
                                            </label>
                                            <CustomMonthPicker
                                                value={form.month}
                                                onChange={(val) => setForm({ ...form, month: val })}
                                            />
                                        </div>
                                        <div className="form-control overflow-visible">
                                            <label className="label py-1">
                                                <span className="label-text">Reminder Date (Optional)</span>
                                            </label>
                                            <CustomDatePicker
                                                value={form.reminder_date || ''}
                                                onChange={(val) => setForm({ ...form, reminder_date: val })}
                                                defaultMonth={form.month}
                                            />
                                        </div>
                                    {/* Row 1.5: Frequency */}
                                    <div className="form-control md:col-span-2">
                                        <label className="label py-1">
                                            <span className="label-text">Frequency (Optional)</span>
                                        </label>
                                        <div className="text-xs text-base-content/60 mb-1">
                                            Creates plans for next 3 years
                                        </div>
                                        <CustomSelect
                                            options={[
                                                { value: '', label: 'One-time (no repeat)' },
                                                { value: 'monthly', label: 'Every Month' },
                                                { value: 'bi-monthly', label: 'Every Two Months' },
                                                { value: 'quarterly', label: 'Quarterly' },
                                                { value: 'yearly', label: 'Every Year' }
                                            ]}
                                            value={form.frequency}
                                            onChange={(val) => setForm({ ...form, frequency: val })}
                                            placeholder="Select Frequency"
                                        />
                                    </div>
                                    {/* Row 2: Category, Subcategory */}
                                    <div className="form-control">
                                        <label className="label py-1">
                                            <span className="label-text">Category</span>
                                        </label>
                                        <CustomSelect
                                            options={categories.map(c => ({ label: c.name, value: c.id, color: c.color }))}
                                            value={form.categoryId}
                                            onChange={(val) => setForm({ ...form, categoryId: val, subcategoryId: '' })}
                                            placeholder="Select Category"
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label py-1">
                                            <span className="label-text">Subcategory</span>
                                        </label>
                                        <CustomSelect
                                            options={selectedCategory?.subcategories?.map(s => ({ label: s.name, value: s.id })) || []}
                                            value={form.subcategoryId}
                                            onChange={(val) => setForm({ ...form, subcategoryId: val })}
                                            placeholder={selectedCategory?.subcategories?.length ? "Select Subcategory" : "No Subcategory"}
                                            disabled={!selectedCategory?.subcategories?.length}
                                        />
                                    </div>
                                    {/* Row 3: Amount, Type */}
                                    <div className="form-control">
                                        <label className="label py-1">
                                            <span className="label-text">Amount ({getCurrencySymbol(userMainCurrency)})</span>
                                        </label>
                                        <div className="relative">
                                            {type === 'expense' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 z-10 pointer-events-none">-</span>}
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                className="input input-bordered w-full h-10 md:h-12 text-base"
                                                style={{ paddingLeft: type === 'expense' ? '2rem' : '1rem' }}
                                                placeholder={`Amount (${getCurrencySymbol(userMainCurrency)})`}
                                                value={form.amount}
                                                onChange={e => {
                                                    let val = e.target.value.replace(/[^0-9-]/g, ''); // Allow digits and minus
                                                    // Ensure minus is only at the start
                                                    if (val.includes('-')) {
                                                        val = '-' + val.replace(/-/g, '');
                                                    }
                                                    setForm({ ...form, amount: val });
                                                }}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-control">
                                        <label className="label py-1">
                                            <span className="label-text">Type</span>
                                        </label>
                                        <div className="join w-full">
                                            <button
                                                type="button"
                                                className={`join-item btn flex-1 h-10 md:h-12 text-sm md:text-base ${type === 'expense' ? 'btn-passover-red' : 'btn-outline'}`}
                                                onClick={() => setType('expense')}
                                            >
                                                Expense (-)
                                            </button>
                                            <button
                                                type="button"
                                                className={`join-item btn flex-1 h-10 md:h-12 text-sm md:text-base ${type === 'income' ? 'btn-success text-white' : 'btn-outline'}`}
                                                onClick={() => setType('income')}
                                            >
                                                Income (+)
                                            </button>
                                        </div>
                                    </div>
                                    </div>
                                    <div className="flex justify-end mt-4 pt-4 border-t border-base-300">
                                        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={submitting}>
                                            {submitting ? <span className="loading loading-spinner"></span> : 'Create Plan'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>,
                    document.body
                ) : null)}

                {/* Edit Modal */}
                {isEditModalOpen && editingPlan && (typeof window !== 'undefined' ? createPortal(
                    <div className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false); }}>
                        <div 
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                            style={{ zIndex: 99998 }}
                            onClick={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false); }}
                        />
                        <div className="modal-box w-11/12 max-w-2xl max-h-[90vh] relative p-0 flex flex-col overflow-hidden" style={{ zIndex: 99999 }} onClick={(e) => e.stopPropagation()}>
                            <div className="sticky top-0 bg-base-100 z-10 border-b border-base-300 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center flex-shrink-0">
                                <h3 className="font-bold text-lg">Edit Plan</h3>
                                <button 
                                    className="btn btn-sm btn-circle btn-ghost" 
                                    onClick={() => setIsEditModalOpen(false)}
                                    aria-label="Close"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
                                <form onSubmit={handleUpdatePlan} className="flex flex-col gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Category</span>
                                    </label>
                                    <input type="text" className="input input-bordered" value={`${editingPlan.category_name}${editingPlan.subcategory_name ? ' / ' + editingPlan.subcategory_name : ''}`} disabled />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Amount ({getCurrencySymbol(userMainCurrency)})</span>
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        className="input input-bordered"
                                        value={editingPlan.amount}
                                        onChange={e => {
                                            let val = e.target.value.replace(/[^0-9-]/g, ''); // Allow digits and minus
                                            // Ensure minus is only at the start
                                            if (val.includes('-')) {
                                                val = '-' + val.replace(/-/g, '');
                                            }
                                            setEditingPlan({ ...editingPlan, amount: val });
                                        }}
                                        autoFocus
                                    />
                                </div>
                                <div className="form-control overflow-visible">
                                    <CustomDatePicker
                                        value={editingPlan.reminder_date ? (() => {
                                            const dateStr = editingPlan.reminder_date;
                                            if (dateStr.includes('T')) {
                                                const date = new Date(dateStr);
                                                const year = date.getFullYear();
                                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                                const day = String(date.getDate()).padStart(2, '0');
                                                return `${year}-${month}-${day}`;
                                            } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
                                                return dateStr.slice(0, 10);
                                            } else {
                                                const [year, month, day] = dateStr.split('-').map(Number);
                                                if (year && month && day) {
                                                    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                }
                                                return dateStr.slice(0, 10);
                                            }
                                        })() : ''}
                                        onChange={(val) => setEditingPlan({ ...editingPlan, reminder_date: val })}
                                        label="Reminder Date (Optional)"
                                        defaultMonth={editingPlan.month || month}
                                    />
                                </div>
                                    <div className="flex justify-end mt-4 pt-4 border-t border-base-300">
                                        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={submitting}>
                                            {submitting ? <span className="loading loading-spinner"></span> : 'Save'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>,
                    document.body
                ) : null)}

                {/* Reminder Modal */}
                {reminderModal.isOpen && reminderModal.plan && (typeof window !== 'undefined' ? createPortal(
                    <div className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) setReminderModal({ isOpen: false, plan: null, month: '' }); }}>
                        <div 
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                            style={{ zIndex: 99998 }}
                            onClick={(e) => { if (e.target === e.currentTarget) setReminderModal({ isOpen: false, plan: null, month: '' }); }}
                        />
                        <div className="modal-box w-[95vw] max-w-6xl max-h-[90vh] relative p-0 flex flex-col" style={{ zIndex: 99999, overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                            <div className="sticky top-0 bg-base-100 z-10 border-b border-base-300 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center flex-shrink-0">
                                <h3 className="font-bold text-lg">Set Reminder</h3>
                                <button 
                                    className="btn btn-sm btn-circle btn-ghost" 
                                    onClick={() => setReminderModal({ isOpen: false, plan: null, month: '' })}
                                    aria-label="Close"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 p-4 md:p-6 pb-8">
                                <div className="flex flex-col gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Category: {reminderModal.plan.category_name}{reminderModal.plan.subcategory_name ? ` / ${reminderModal.plan.subcategory_name}` : ''}</span>
                                    </label>
                                </div>
                                <div className="form-control overflow-visible">
                                    <CustomDatePicker
                                        value={reminderModal.plan.reminder_date ? (() => {
                                            const dateStr = reminderModal.plan.reminder_date;
                                            if (dateStr.includes('T')) {
                                                const date = new Date(dateStr);
                                                const year = date.getFullYear();
                                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                                const day = String(date.getDate()).padStart(2, '0');
                                                return `${year}-${month}-${day}`;
                                            } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
                                                return dateStr.slice(0, 10);
                                            } else {
                                                return reminderModal.plan.reminder_date?.slice(0, 10) || '';
                                            }
                                        })() : ''}
                                        onChange={(val) => {
                                            handleReminderUpdate(reminderModal.plan.id, val || null, reminderModal.month);
                                        }}
                                        label="Reminder Date"
                                        defaultMonth={reminderModal.month}
                                    />
                                </div>
                                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-base-300">
                                        <button className="btn btn-ghost w-full sm:w-auto" onClick={() => setReminderModal({ isOpen: false, plan: null, month: '' })}>Close</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                ) : null)}

                {/* Copy Plans Modal */}
                {isCopyModalOpen && (typeof window !== 'undefined' ? createPortal(
                    <div className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) setIsCopyModalOpen(false); }}>
                        <div 
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                            style={{ zIndex: 99998 }}
                            onClick={(e) => { if (e.target === e.currentTarget) setIsCopyModalOpen(false); }}
                        />
                        <div className="modal-box w-11/12 max-w-xl max-h-[90vh] relative p-0 flex flex-col overflow-hidden" style={{ zIndex: 99999 }} onClick={(e) => e.stopPropagation()}>
                            <div className="sticky top-0 bg-base-100 z-10 border-b border-base-300 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center flex-shrink-0">
                                <h3 className="font-bold text-lg">Copy Plans</h3>
                                <button 
                                    className="btn btn-sm btn-circle btn-ghost" 
                                    onClick={() => setIsCopyModalOpen(false)}
                                    aria-label="Close"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
                                <form onSubmit={handleCopyPlans} className="flex flex-col gap-4">
                                    <div className="form-control overflow-visible">
                                        <label className="label">
                                            <span className="label-text">Copy from Month</span>
                                        </label>
                                        <CustomMonthPicker
                                            value={copyFromMonth}
                                            onChange={setCopyFromMonth}
                                        />
                                        <label className="label">
                                            <span className="label-text-alt text-base-content/60">
                                                Plans from the selected month will be copied to {month}
                                            </span>
                                        </label>
                                    </div>
                                    <div className="flex justify-end mt-4 pt-4 border-t border-base-300">
                                        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={submitting}>
                                            {submitting ? <span className="loading loading-spinner"></span> : 'Copy Plans'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>,
                    document.body
                ) : null)}

                {/* Confirm Modal */}
                {confirmAction.isOpen && (typeof window !== 'undefined' ? createPortal(
                    <div className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) setConfirmAction({ ...confirmAction, isOpen: false }); }}>
                        <div 
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                            style={{ zIndex: 99998 }}
                            onClick={(e) => { if (e.target === e.currentTarget) setConfirmAction({ ...confirmAction, isOpen: false }); }}
                        />
                        <div className="modal-box w-11/12 max-w-md relative p-0" style={{ zIndex: 99999 }} onClick={(e) => e.stopPropagation()}>
                            <div className="sticky top-0 bg-base-100 z-10 border-b border-base-300 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center flex-shrink-0">
                                <h3 className="font-bold text-lg">{confirmAction.title}</h3>
                                <button 
                                    className="btn btn-sm btn-circle btn-ghost" 
                                    onClick={() => setConfirmAction({ ...confirmAction, isOpen: false })}
                                    aria-label="Close"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                                <p className="py-4">{confirmAction.message}</p>
                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-base-300">
                                    <button className="btn btn-error w-full sm:w-auto" onClick={handleConfirm}>Confirm</button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                ) : null)}
            </div>
        </div>
    );
}
