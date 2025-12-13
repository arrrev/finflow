"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useToaster } from '@/components/Toaster';
import CustomSelect from '@/components/CustomSelect';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomMonthPicker from '@/components/CustomMonthPicker';
import { formatDate } from '@/lib/utils';

export default function PlanningPage() {
    const { success, error } = useToaster();
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [plans, setPlans] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="card-title">Monthly Planning</h2>
                    <div className="w-48">
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
                <form onSubmit={handleAddPlan} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 bg-base-200 p-4 rounded-xl">
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
                            placeholder="Amount (֏)"
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
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <div className="flex gap-2 items-center text-sm w-64">
                        <span>Filter:</span>
                        <CustomSelect
                            options={[{ value: '', label: 'All Categories' }, ...activeCategories.map(c => ({ label: c.name, value: c.id, color: c.color }))]}
                            value={filterCategory}
                            onChange={(val) => setFilterCategory(val)}
                        />
                    </div>

                    <div className="flex gap-2 items-center text-sm">
                        <span>Copy from:</span>
                        <div className="w-40">
                            <CustomMonthPicker
                                value={copyMonth}
                                onChange={setCopyMonth}
                                size="small"
                            />
                        </div>
                        <button onClick={confirmCopy} className="btn btn-sm btn-outline">Copy</button>
                    </div>
                </div>

                {/* Plans List */}
                <div className="space-y-4">
                    {filteredPlans.map(p => {
                        const planned = Math.abs(parseFloat(p.amount));
                        const spent = Math.abs(parseFloat(p.spent || 0));
                        const isOver = spent > planned;
                        const percent = planned > 0 ? (spent / planned) * 100 : (spent > 0 ? 100 : 0);
                        const remaining = planned - spent;
                        const isIncome = parseFloat(p.amount) > 0;

                        return (
                            <div key={p.id} className="card bg-base-100 shadow-sm border border-base-200">
                                <div className="card-body p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.category_color || '#ccc' }}></div>
                                            <div>
                                                <div className="font-bold flex items-center gap-2">
                                                    {p.category_name}
                                                    {p.subcategory_name && <span className="opacity-50 text-sm font-normal">/ {p.subcategory_name}</span>}
                                                </div>
                                                {p.reminder_date && (
                                                    <div className="text-xs badge badge-ghost gap-1 mt-1">
                                                        <span>⏰</span>
                                                        {formatDate(p.reminder_date)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xl font-mono font-bold cursor-pointer hover:text-primary ${Number(p.amount) < 0 ? 'text-gray-700' : 'text-success'}`} onClick={() => openEditModal(p)} title="Click to edit">
                                                {Number(p.amount).toLocaleString()} ֏
                                            </div>
                                            <div className="text-xs opacity-50">Planned</div>
                                        </div>
                                    </div>

                                    {/* Progress Bar (Only for expenses usually, but income too) */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>
                                                <span className={isOver ? 'text-error font-bold' : ''}>{spent.toLocaleString()}</span>
                                                <span className="opacity-50"> spent</span>
                                            </span>
                                            <span className={remaining < 0 ? 'text-error' : 'text-success'}>
                                                {remaining < 0 ? `${Math.abs(remaining).toLocaleString()} over` : `${remaining.toLocaleString()} left`}
                                            </span>
                                        </div>
                                        <div className="w-full bg-base-200 rounded-full h-3">
                                            <div
                                                className={`h-3 rounded-full transition-all duration-500 ${isOver ? 'bg-error' : isIncome ? 'bg-success' : 'bg-primary'}`}
                                                style={{ width: `${Math.min(percent, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-2">
                                        <button onClick={() => confirmDelete(p.id)} className="btn btn-xs btn-ghost text-error opacity-50 hover:opacity-100">Delete</button>
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
                        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
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
                                        <span className="label-text">Amount (֏)</span>
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
                                        value={editingPlan.reminder_date ? new Date(editingPlan.reminder_date).toISOString().slice(0, 10) : ''}
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
                        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
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
