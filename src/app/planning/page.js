"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useToaster } from '@/components/Toaster';

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

    const handleAddPlan = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    month,
                    category_id: form.categoryId,
                    subcategory_id: form.subcategoryId || null,
                    amount: form.amount
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

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null); // { id, amount, ... }

    const [confirmAction, setConfirmAction] = useState({ isOpen: false, type: '', id: null, title: '', message: '' });

    const openEditModal = (plan) => {
        setEditingPlan({ ...plan });
        setIsEditModalOpen(true);
    };

    const handleUpdatePlan = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/plans', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingPlan.id, amount: editingPlan.amount })
            });
            if (!res.ok) throw new Error('Failed');
            success('Plan updated');
            setIsEditModalOpen(false);
            setEditingPlan(null);
            fetchPlans();
        } catch (e) {
            error('Update failed');
        }
    };

    const confirmDelete = (id) => {
        setConfirmAction({
            isOpen: true,
            type: 'delete',
            id,
            title: 'Delete Plan',
            message: 'Are you sure you want to delete this plan?'
        });
    };

    const confirmCopy = () => {
        if (!copyMonth) return;
        setConfirmAction({
            isOpen: true,
            type: 'copy',
            id: null,
            title: 'Copy Plans',
            message: `Copy plans from ${copyMonth} to ${month}? This will add to existing plans.`
        });
    };

    const handleConfirm = () => {
        if (confirmAction.type === 'delete') {
            handleDelete(confirmAction.id);
        } else if (confirmAction.type === 'copy') {
            handleCopyExecute();
        }
        setConfirmAction({ ...confirmAction, isOpen: false });
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`/api/plans?id=${id}`, { method: 'DELETE' });
            success('Plan deleted');
            fetchPlans();
        } catch (e) {
            error('Error deleting plan');
        }
    };

    const handleCopyExecute = async () => {
        try {
            const res = await fetch('/api/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'copy',
                    fromMonth: copyMonth,
                    toMonth: month
                })
            });
            if (!res.ok) throw new Error('Copy failed');
            success('Plans copied');
            fetchPlans();
        } catch (e) {
            error('Error copying plans');
        }
    };

    // Sort Logic
    const [sortField, setSortField] = useState('category_name');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [filterCategory, setFilterCategory] = useState('');

    const handleSort = (field) => {
        if (sortField === field) setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        else {
            setSortField(field);
            setSortOrder('ASC');
        }
    };

    const filteredPlans = plans
        .filter(p => !filterCategory || p.category_id == filterCategory)
        .sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];

            // Handle number comparison
            if (sortField === 'amount') {
                valA = Number(valA);
                valB = Number(valB);
            } else {
                valA = (valA || '').toString().toLowerCase();
                valB = (valB || '').toString().toLowerCase();
            }

            if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
            if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
            return 0;
        });

    const selectedCategory = categories.find(c => c.id == form.categoryId);

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="card-title">Monthly Planning</h2>
                    <input
                        type="month"
                        className="input input-bordered"
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                    />
                </div>

                {/* Create Plan Form */}
                <form onSubmit={handleAddPlan} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-base-200 p-4 rounded-xl">
                    <select
                        className="select select-bordered"
                        value={form.categoryId}
                        onChange={e => setForm({ ...form, categoryId: e.target.value, subcategoryId: '' })}
                        required
                    >
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <select
                        className="select select-bordered"
                        value={form.subcategoryId}
                        onChange={e => setForm({ ...form, subcategoryId: e.target.value })}
                        disabled={!selectedCategory?.subcategories?.length}
                    >
                        <option value="">No Subcategory</option>
                        {selectedCategory?.subcategories?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <input
                        type="number"
                        className="input input-bordered"
                        placeholder="Amount (֏)"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        required
                    />

                    <button className="btn btn-primary">Add Plan</button>
                </form>

                {/* Controls */}
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <div className="flex gap-2 items-center text-sm">
                        <span>Filter:</span>
                        <select
                            className="select select-bordered select-sm"
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="flex gap-2 items-center text-sm">
                        <span>Copy from:</span>
                        <input
                            type="month"
                            className="input input-bordered input-sm"
                            value={copyMonth}
                            onChange={e => setCopyMonth(e.target.value)}
                        />
                        <button onClick={confirmCopy} className="btn btn-sm btn-outline">Copy</button>
                    </div>
                </div>

                {/* Plans List */}
                <div className="overflow-x-auto">
                    <table className="table table-zebra">
                        <thead>
                            <tr className="cursor-pointer hover:bg-base-200">
                                <th onClick={() => handleSort('category_name')}>Category {sortField === 'category_name' && (sortOrder === 'ASC' ? '↑' : '↓')}</th>
                                <th onClick={() => handleSort('subcategory_name')}>Subcategory {sortField === 'subcategory_name' && (sortOrder === 'ASC' ? '↑' : '↓')}</th>
                                <th onClick={() => handleSort('amount')} className="text-right">Planned Amount {sortField === 'amount' && (sortOrder === 'ASC' ? '↑' : '↓')}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPlans.map(p => (
                                <tr key={p.id} className="hover:bg-base-200">
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.category_color || '#ccc' }}></div>
                                            <span className="font-bold">{p.category_name}</span>
                                        </div>
                                    </td>
                                    <td>{p.subcategory_name || '-'}</td>
                                    <td className={`text-right font-mono text-lg cursor-pointer hover:text-primary ${Number(p.amount) < 0 ? 'text-error' : 'text-success'}`} onClick={() => openEditModal(p)} title="Click to edit">
                                        {Number(p.amount).toLocaleString()} ֏
                                    </td>
                                    <td className="text-right">
                                        <button onClick={() => confirmDelete(p.id)} className="btn btn-xs btn-ghost text-error">✕</button>
                                    </td>
                                </tr>
                            ))}
                            {filteredPlans.length === 0 && <tr><td colSpan="4" className="text-center opacity-50 py-8">No plans found</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* Edit Modal */}
                {isEditModalOpen && editingPlan && (
                    <dialog className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg">Edit Plan Amount</h3>
                            <form onSubmit={handleUpdatePlan} className="py-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Category</span>
                                    </label>
                                    <input type="text" className="input input-bordered" value={editingPlan.category_name} disabled />
                                </div>
                                <div className="form-control mt-4">
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
                                <div className="modal-action">
                                    <button type="button" className="btn" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save</button>
                                </div>
                            </form>
                        </div>
                    </dialog>
                )}

                {/* Confirm Modal */}
                {confirmAction.isOpen && (
                    <dialog className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg">{confirmAction.title}</h3>
                            <p className="py-4">{confirmAction.message}</p>
                            <div className="modal-action">
                                <button className="btn" onClick={() => setConfirmAction({ ...confirmAction, isOpen: false })}>Cancel</button>
                                <button className="btn btn-error" onClick={handleConfirm}>Confirm</button>
                            </div>
                        </div>
                    </dialog>
                )}
            </div>
        </div>
    );
}
