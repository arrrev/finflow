"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useToaster } from '@/components/Toaster';
import CustomSelect from '@/components/CustomSelect';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomMonthPicker from '@/components/CustomMonthPicker';
import { formatDate, getCurrencySymbol } from '@/lib/utils';

export default function PlanningPage() {
    const { success, error } = useToaster();
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [plans, setPlans] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userMainCurrency, setUserMainCurrency] = useState('USD');

    const [form, setForm] = useState({ categoryId: '', subcategoryId: '', amount: '' });
    const [copyMonth, setCopyMonth] = useState('');

    const fetchPlans = useCallback(() => {
        setLoading(true);
        fetch(`/api/plans?month=${month}`)
            .then(res => res.json())
            .then(data => {
                setPlans(data);
                setLoading(false);
            });
    }, [month]);

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
        fetchPlans();
    }, [fetchPlans]);

    const [type, setType] = useState('expense'); // 'expense' or 'income'

    const handleAddPlan = async (e) => {
        e.preventDefault();
        try {
            let finalAmount = parseFloat(form.amount);
            if (type === 'expense' && finalAmount > 0) finalAmount = -finalAmount;
            if (type === 'income' && finalAmount < 0) finalAmount = Math.abs(finalAmount);

            const res = await fetch('/api/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    month,
                    category_id: form.categoryId,
                    subcategory_id: form.subcategoryId || null,
                    amount: finalAmount,
                    reminder_date: form.reminder_date
                })
            });
            if (!res.ok) throw new Error('Failed');
            success('Plan added');
            fetchPlans();
            setForm({ ...form, amount: '' }); // keep category selected
        } catch (e) {
            error('Error adding plan');
        }
    };

    const [filterCategory, setFilterCategory] = useState('');
    const [sortField, setSortField] = useState('category_name');
    const [sortOrder, setSortOrder] = useState('ASC');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [confirmAction, setConfirmAction] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    // Handle ESC key for Edit Modal
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isEditModalOpen) {
                setIsEditModalOpen(false);
            }
        };
        if (isEditModalOpen) {
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [isEditModalOpen]);

    // Handle ESC key for Confirm Modal
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && confirmAction.isOpen) {
                setConfirmAction({ ...confirmAction, isOpen: false });
            }
        };
        if (confirmAction.isOpen) {
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [confirmAction]);

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

    const confirmCopy = () => {
        if (!copyMonth) return;
        setConfirmAction({
            isOpen: true,
            title: 'Copy Plan',
            message: `Are you sure you want to copy plans from ${copyMonth} to ${month}? This will append to existing plans.`,
            onConfirm: handleCopyPlan
        });
    };

    const handleCopyPlan = async () => {
        try {
            const res = await fetch('/api/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'copy', fromMonth: copyMonth, toMonth: month })
            });
            if (!res.ok) throw new Error('Failed');
            success('Plans copied');
            setConfirmAction({ isOpen: false });
            fetchPlans();
        } catch (e) {
            error('Failed to copy plans');
        }
    };

    const openEditModal = (plan) => {
        setEditingPlan(plan);
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
            fetchPlans();
        } catch (e) {
            error('Error updating plan');
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
            fetchPlans();
        } catch (e) {
            error('Error deleting plan');
        }
    };

    const handleConfirm = () => {
        if (confirmAction.onConfirm) confirmAction.onConfirm();
    };

    const selectedCategory = activeCategories.find(c => c.id == form.categoryId);

    // Calculate total sum
    const totalSum = filteredPlans.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
                    <div>
                        <h2 className="card-title text-lg md:text-xl">Monthly Planning</h2>
                        <div className={`text-sm font-mono font-bold mt-1 ${totalSum < 0 ? 'text-error' : 'text-success'}`}>
                            Total: {getCurrencySymbol(userMainCurrency)} {Math.abs(totalSum).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                    <div className="w-full sm:w-48">
                        <CustomMonthPicker
                            value={month}
                            onChange={setMonth}
                            size="small"
                        />
                    </div>
                </div>

                {/* Expense/Income Toggle */}
                <div className="flex justify-center mb-4">
                    <div className="join">
                        <button
                            className={`join-item btn btn-sm ${type === 'expense' ? 'btn-passover-red' : 'btn-outline'}`}
                            onClick={() => setType('expense')}
                        >
                            Expense (-)
                        </button>
                        <button
                            className={`join-item btn btn-sm ${type === 'income' ? 'btn-success text-white' : 'btn-outline'}`}
                            onClick={() => setType('income')}
                        >
                            Income (+)
                        </button>
                    </div>
                </div>

                {/* Create Plan Form */}
                <form onSubmit={handleAddPlan} className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4 mb-4 bg-base-200 p-3 md:p-4 rounded-xl">
                    <CustomSelect
                        options={activeCategories.map(c => ({ label: c.name, value: c.id, color: c.color }))}
                        value={form.categoryId}
                        onChange={(val) => setForm({ ...form, categoryId: val, subcategoryId: '' })}
                        placeholder="Select Category"
                        size="small"
                    />

                    <CustomSelect
                        options={selectedCategory?.subcategories?.map(s => ({ label: s.name, value: s.id })) || []}
                        value={form.subcategoryId}
                        onChange={(val) => setForm({ ...form, subcategoryId: val })}
                        placeholder={selectedCategory?.subcategories?.length ? "Select Subcategory" : "No Subcategory"}
                        disabled={!selectedCategory?.subcategories?.length}
                        size="small"
                    />

                    <div className="relative w-full">
                        {type === 'expense' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 z-10 pointer-events-none">-</span>}
                        <input
                            type="number"
                            className={`input input-bordered w-full h-8 min-h-8 text-sm ${type === 'expense' ? 'pl-8' : ''}`}
                            style={{
                                height: '2rem',
                                minHeight: '2rem',
                                paddingTop: '0.25rem',
                                paddingBottom: '0.25rem',
                                paddingLeft: type === 'expense' ? '2rem' : '0.5rem',
                                paddingRight: '0.5rem'
                            }}
                            placeholder={`Amount (${getCurrencySymbol(userMainCurrency)})`}
                            value={form.amount}
                            onChange={e => setForm({ ...form, amount: e.target.value })}
                            required
                        />
                    </div>

                    <div className="tooltip tooltip-bottom" data-tip="Optional Reminder Date">
                        <CustomDatePicker
                            value={form.reminder_date || ''}
                            onChange={(val) => setForm({ ...form, reminder_date: val })}
                            label="Reminder Date"
                            size="small"
                        />
                    </div>

                    <button className="btn btn-primary h-8 min-h-8 text-sm py-0">Add Plan</button>
                </form>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center mb-6 gap-3 md:gap-4">
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center text-sm w-full sm:w-64">
                        <span className="whitespace-nowrap">Filter:</span>
                        <div className="w-full sm:flex-1">
                            <CustomSelect
                                options={[{ value: '', label: 'All Categories' }, ...activeCategories.map(c => ({ label: c.name, value: c.id, color: c.color }))]}
                                value={filterCategory}
                                onChange={(val) => setFilterCategory(val)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center text-sm w-full sm:w-auto">
                        <span className="whitespace-nowrap">Copy from:</span>
                        <div className="w-full sm:w-auto">
                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                                <div className="w-full sm:w-40">
                                    <CustomMonthPicker
                                        value={copyMonth}
                                        onChange={setCopyMonth}
                                        size="small"
                                    />
                                </div>
                                <button onClick={confirmCopy} className="btn btn-sm btn-outline w-full sm:w-auto">Copy</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plans List */}
                <div className="space-y-4">
                    {filteredPlans.map(p => {
                        const isExpense = Number(p.amount) < 0;
                        return (
                            <div key={p.id} className="card bg-base-100 shadow-sm border border-base-200">
                                <div className="card-body p-3">
                                    <div className="flex flex-col gap-2">
                                        {/* First line: Category/Subcategory on left, Amount/Actions on right */}
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
                                        {/* Second line: Date on left */}
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
                    })}
                    {filteredPlans.length === 0 && <div className="text-center opacity-50 py-10">No plans for this month</div>}
                </div>

                {/* Edit Modal */}
                {isEditModalOpen && editingPlan && (typeof window !== 'undefined' ? createPortal(
                    <dialog className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false); }}>
                        <div className="modal-box w-11/12 max-w-2xl" onClick={(e) => e.stopPropagation()}>
                            <h3 className="font-bold text-lg">Edit Plan</h3>
                            <form onSubmit={handleUpdatePlan} className="py-4 flex flex-col gap-4">
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
                                        type="number"
                                        className="input input-bordered"
                                        value={editingPlan.amount}
                                        onChange={e => setEditingPlan({ ...editingPlan, amount: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div className="form-control">
                                    <CustomDatePicker
                                        value={editingPlan.reminder_date ? (() => {
                                            // Parse date in local timezone to avoid UTC conversion
                                            const dateStr = editingPlan.reminder_date;
                                            if (dateStr.includes('T')) {
                                                // If it's an ISO string with time, parse in local timezone
                                                const date = new Date(dateStr);
                                                const year = date.getFullYear();
                                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                                const day = String(date.getDate()).padStart(2, '0');
                                                return `${year}-${month}-${day}`;
                                            } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
                                                // Already in YYYY-MM-DD format, use as-is
                                                return dateStr.slice(0, 10);
                                            } else {
                                                // Try to parse as date and format
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
                                <div className="modal-action">
                                    <button type="button" className="btn" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save</button>
                                </div>
                            </form>
                        </div>
                    </dialog>,
                    document.body
                ) : null)}

                {/* Confirm Modal */}
                {confirmAction.isOpen && (typeof window !== 'undefined' ? createPortal(
                    <dialog className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) setConfirmAction({ ...confirmAction, isOpen: false }); }}>
                        <div className="modal-box w-11/12 max-w-md" onClick={(e) => e.stopPropagation()}>
                            <h3 className="font-bold text-lg">{confirmAction.title}</h3>
                            <p className="py-4">{confirmAction.message}</p>
                            <div className="modal-action">
                                <button className="btn" onClick={() => setConfirmAction({ ...confirmAction, isOpen: false })}>Cancel</button>
                                <button className="btn btn-error" onClick={handleConfirm}>Confirm</button>
                            </div>
                        </div>
                    </dialog>,
                    document.body
                ) : null)}
            </div>
        </div>
    );
}
