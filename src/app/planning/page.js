"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useToaster } from '@/components/Toaster';
import CustomSelect from '@/components/CustomSelect';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomMonthPicker from '@/components/CustomMonthPicker';
import CustomYearPicker from '@/components/CustomYearPicker';
import { formatDate, getCurrencySymbol } from '@/lib/utils';

export default function PlanningPage() {
    const { success, error } = useToaster();
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [plans, setPlans] = useState([]);
    const [yearPlans, setYearPlans] = useState({}); // { "YYYY-MM": [plans] }
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userMainCurrency, setUserMainCurrency] = useState('USD');
    const [viewMode, setViewMode] = useState('month'); // 'month' or 'year'

    const [form, setForm] = useState({ 
        month: month,
        categoryId: '', 
        subcategoryId: '', 
        amount: '',
        reminder_date: ''
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
        try {
            if (!form.categoryId) {
                error('Please select a category');
                return;
            }
            if (!form.amount || form.amount === '-' || parseFloat(form.amount) === 0) {
                error('Please enter a valid amount');
                return;
            }

            let finalAmount = Math.round(parseFloat(form.amount) || 0);
            // Only apply type-based conversion if amount is positive
            // If user enters negative directly, respect it
            if (finalAmount > 0) {
                if (type === 'expense') finalAmount = -finalAmount;
            } else if (finalAmount < 0 && type === 'income') {
                // If user enters negative for income, convert to positive
                finalAmount = Math.abs(finalAmount);
            }

            const res = await fetch('/api/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    month: form.month,
                    category_id: form.categoryId,
                    subcategory_id: form.subcategoryId || null,
                    amount: finalAmount,
                    reminder_date: form.reminder_date || null
                })
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to create plan');
            }
            success('Plan added');
            setIsCreateModalOpen(false);
            setForm({ month: viewMode === 'month' ? month : `${year}-01`, categoryId: '', subcategoryId: '', amount: '', reminder_date: '' });
            if (viewMode === 'month') {
                fetchPlans();
            } else {
                fetchYearPlans();
            }
        } catch (e) {
            console.error('Error adding plan:', e);
            error(e.message || 'Error adding plan');
        }
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

    // Filter categories (assume true if undefined)
    const activeCategories = categories.filter(c => c.include_in_chart !== false);

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
            amount: plan.amount ? String(plan.amount) : ''
        });
        setIsEditModalOpen(true);
    };

    const handleUpdatePlan = async (e) => {
        e.preventDefault();
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
        if (!copyFromMonth) {
            error('Please select a month to copy from');
            return;
        }
        if (copyFromMonth === month) {
            error('Cannot copy from the same month');
            return;
        }
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
        }
    };

    const handleConfirm = () => {
        if (confirmAction.onConfirm) confirmAction.onConfirm();
    };

    const selectedCategory = activeCategories.find(c => c.id == form.categoryId);

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

        // Build matrix rows
        categorySubcatMap.forEach((catSubcat, key) => {
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

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-4 md:p-6 relative">
                <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
                    <div>
                        <h2 className="card-title text-lg md:text-xl">Monthly Planning</h2>
                        {viewMode === 'month' && (
                            <div className={`text-sm font-mono font-bold mt-1 ${totalSum < 0 ? 'text-error' : 'text-success'}`}>
                                Total: {getCurrencySymbol(userMainCurrency)} {Math.abs(totalSum).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center text-sm">
                        <span className="whitespace-nowrap text-xs sm:text-sm">Filter:</span>
                        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
                            {viewMode === 'month' && (
                                <div className="w-full sm:w-40">
                                    <CustomMonthPicker
                                        value={month}
                                        onChange={setMonth}
                                        size="small"
                                    />
                                </div>
                            )}
                            {viewMode === 'year' && (
                                <div className="w-full sm:w-40">
                                    <CustomYearPicker
                                        value={year}
                                        onChange={setYear}
                                        size="small"
                                    />
                                </div>
                            )}
                            <div className="w-full sm:w-48">
                                <CustomSelect
                                    options={[{ value: '', label: 'All Categories' }, ...activeCategories.map(c => ({ label: c.name, value: c.id, color: c.color }))]}
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
                                setForm({ month: viewMode === 'month' ? month : `${year}-01`, categoryId: '', subcategoryId: '', amount: '', reminder_date: '' });
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
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                            <thead>
                                <tr>
                                    <th className="sticky left-0 bg-base-100 z-10">Category / Subcategory</th>
                                    {yearMonths.map(monthKey => {
                                        const [yearNum, monthNum] = monthKey.split('-');
                                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                        return (
                                            <th key={monthKey} className="text-center min-w-[120px]">
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
                                            <td className="sticky left-0 bg-base-100 z-10">
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
                                                                        setEditValue(plan.amount);
                                                                    } else {
                                                                        setEditValue('');
                                                                    }
                                                                    setEditingCell(cellKey);
                                                                }}
                                                            >
                                                                {plan ? (
                                                                    <>
                                                                        <div className={`text-sm font-mono ${Number(plan.amount) < 0 ? 'text-error' : 'text-success'}`}>
                                                                            {Number(plan.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                                        </div>
                                                                        {plan.reminder_date && (
                                                                            <span className="text-xs" title={formatDate(plan.reminder_date)}>⏰</span>
                                                                        )}
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
                        <div className="modal-box w-11/12 max-w-4xl relative" style={{ zIndex: 99999 }} onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
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
                            <form onSubmit={handleAddPlan} className="flex flex-col gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Row 1: Month, Reminder Date */}
                                    <div className="form-control">
                                        <label className="label py-1">
                                            <span className="label-text">Month</span>
                                        </label>
                                        <CustomMonthPicker
                                            value={form.month}
                                            onChange={(val) => setForm({ ...form, month: val })}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label py-1">
                                            <span className="label-text">Reminder Date (Optional)</span>
                                        </label>
                                        <CustomDatePicker
                                            value={form.reminder_date || ''}
                                            onChange={(val) => setForm({ ...form, reminder_date: val })}
                                        />
                                    </div>
                                    {/* Row 2: Category, Subcategory */}
                                    <div className="form-control">
                                        <label className="label py-1">
                                            <span className="label-text">Category</span>
                                        </label>
                                        <CustomSelect
                                            options={activeCategories.map(c => ({ label: c.name, value: c.id, color: c.color }))}
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
                                                className="input input-bordered w-full h-12"
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
                                                className={`join-item btn flex-1 h-12 ${type === 'expense' ? 'btn-passover-red' : 'btn-outline'}`}
                                                onClick={() => setType('expense')}
                                            >
                                                Expense (-)
                                            </button>
                                            <button
                                                type="button"
                                                className={`join-item btn flex-1 h-12 ${type === 'income' ? 'btn-success text-white' : 'btn-outline'}`}
                                                onClick={() => setType('income')}
                                            >
                                                Income (+)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4 pt-4 border-t border-base-300">
                                    <button type="submit" className="btn btn-primary w-full sm:w-auto">Create Plan</button>
                                </div>
                            </form>
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
                        <div className="modal-box w-11/12 max-w-2xl relative p-0" style={{ zIndex: 99999 }} onClick={(e) => e.stopPropagation()}>
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
                            <div className="flex-1 overflow-y-auto p-4 md:p-6">
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
                                <div className="form-control">
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
                                    />
                                </div>
                                    <div className="flex justify-end mt-4 pt-4 border-t border-base-300">
                                        <button type="submit" className="btn btn-primary w-full sm:w-auto">Save</button>
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
                        <div className="modal-box w-11/12 max-w-lg relative p-0" style={{ zIndex: 99999 }} onClick={(e) => e.stopPropagation()}>
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
                            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                                <div className="flex flex-col gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Category: {reminderModal.plan.category_name}{reminderModal.plan.subcategory_name ? ` / ${reminderModal.plan.subcategory_name}` : ''}</span>
                                    </label>
                                </div>
                                <div className="form-control">
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
                                            handleReminderUpdate(reminderModal.plan.id, val, reminderModal.month);
                                        }}
                                        label="Reminder Date (Leave empty to remove)"
                                    />
                                </div>
                                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-base-300">
                                        <button className="btn btn-error w-full sm:w-auto" onClick={() => handleReminderUpdate(reminderModal.plan.id, null, reminderModal.month)}>Remove Reminder</button>
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
                        <div className="modal-box w-11/12 max-w-md relative p-0" style={{ zIndex: 99999 }} onClick={(e) => e.stopPropagation()}>
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
                            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                                <form onSubmit={handleCopyPlans} className="flex flex-col gap-4">
                                    <div className="form-control">
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
                                        <button type="submit" className="btn btn-primary w-full sm:w-auto">Copy Plans</button>
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
