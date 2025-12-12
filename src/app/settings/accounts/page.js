"use client";
import React, { useState, useEffect, useCallback } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import ColorPalette from '@/components/ColorPalette';
import { useToaster } from '@/components/Toaster';
import CustomSelect from '@/components/CustomSelect';

export default function AccountsPage() {
    const { success, error } = useToaster();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newAccName, setNewAccName] = useState('');
    const [newAccColor, setNewAccColor] = useState('#fbbf24');
    const [newAccCurrency, setNewAccCurrency] = useState('AMD');

    // Modal State
    const [deleteId, setDeleteId] = useState(null);

    const fetchAccounts = useCallback(() => {
        fetch('/api/accounts')
            .then(res => res.json())
            .then(data => {
                setAccounts(data);
                setLoading(false);
            })
            .catch(err => {
                error('Failed to load accounts');
                setLoading(false);
            });
    }, [error]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const handleAddAccount = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newAccName,
                    color: newAccColor,
                    default_currency: newAccCurrency
                })
            });
            if (!res.ok) throw new Error('Failed');
            success('Account created');
            setNewAccName('');
            setIsAddModalOpen(false);
            fetchAccounts();
        } catch (e) {
            error('Error creating account');
        }
    };

    const confirmDelete = (id) => setDeleteId(id);

    const handleDeleteAccount = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/accounts?id=${deleteId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            success('Account deleted');
            fetchAccounts();
        } catch (e) {
            error('Error deleting account');
        } finally { setDeleteId(null); }
    };

    const [editingAcc, setEditingAcc] = useState(null);

    const handleEditAccount = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/accounts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingAcc)
            });
            if (!res.ok) throw new Error('Failed');
            success('Account updated');
            setEditingAcc(null);
            fetchAccounts();
        } catch (e) { error('Update failed'); }
    }

    const getCurrencySymbol = (code) => {
        if (code === 'AMD') return '֏';
        if (code === 'USD') return '$';
        if (code === 'EUR') return '€';
        return code;
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="card-title">Account Management</h2>
                    <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>+ Add Account</button>
                </div>

                {/* Edit Modal */}
                {editingAcc && (
                    <dialog className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg">Edit Account</h3>
                            <form onSubmit={handleEditAccount} className="py-4 flex flex-col gap-4">
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Name</span></label>
                                    <input type="text" className="input input-bordered w-full" value={editingAcc.name} onChange={e => setEditingAcc({ ...editingAcc, name: e.target.value })} />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Color</span></label>
                                    <ColorPalette
                                        selectedColor={editingAcc.color}
                                        onSelect={(color) => setEditingAcc({ ...editingAcc, color })}
                                    />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Currency</span></label>
                                    <CustomSelect
                                        options={[
                                            { value: 'AMD', label: 'AMD (֏)' },
                                            { value: 'USD', label: 'USD ($)' },
                                            { value: 'EUR', label: 'EUR (€)' }
                                        ]}
                                        value={editingAcc.default_currency}
                                        onChange={(val) => setEditingAcc({ ...editingAcc, default_currency: val })}
                                        searchable={false}
                                    />
                                </div>
                                <div className="modal-action">
                                    <button type="button" className="btn" onClick={() => setEditingAcc(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save</button>
                                </div>
                            </form>
                        </div>
                    </dialog>
                )}

                {/* Add Account Modal */}
                {isAddModalOpen && (
                    <dialog className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg">Add New Account</h3>
                            <form onSubmit={handleAddAccount} className="py-4 flex flex-col gap-4">
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Name</span></label>
                                    <input type="text" className="input input-bordered w-full" value={newAccName} onChange={e => setNewAccName(e.target.value)} required />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Color</span></label>
                                    <ColorPalette
                                        selectedColor={newAccColor}
                                        onSelect={setNewAccColor}
                                    />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Currency</span></label>
                                    <CustomSelect
                                        options={[
                                            { value: 'AMD', label: 'AMD (֏)' },
                                            { value: 'USD', label: 'USD ($)' },
                                            { value: 'EUR', label: 'EUR (€)' }
                                        ]}
                                        value={newAccCurrency}
                                        onChange={(val) => setNewAccCurrency(val)}
                                        searchable={false}
                                    />
                                </div>
                                <div className="modal-action">
                                    <button type="button" className="btn" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Add</button>
                                </div>
                            </form>
                        </div>
                    </dialog>
                )}

                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Default Currency</th>
                                <th>Balance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((acc) => (
                                <tr key={acc.id} className="hover">
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: acc.color }}></div>
                                            {acc.name}
                                        </div>
                                    </td>
                                    <td>
                                        {getCurrencySymbol(acc.default_currency)}
                                    </td>
                                    <td>
                                        <div className="text-sm font-mono">
                                            {/* Display Balance */}
                                            {acc.default_currency === 'AMD' ? (
                                                <span>{Number(acc.balance_amd).toLocaleString()} ֏</span>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span>
                                                        {(Number(acc.balance_amd) / (acc.default_currency === 'USD' ? 400 : acc.default_currency === 'EUR' ? 420 : 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getCurrencySymbol(acc.default_currency)}
                                                    </span>
                                                    <span className="text-xs opacity-70">≈ {Number(acc.balance_amd).toLocaleString()} ֏</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingAcc(acc)} className="btn btn-xs btn-info btn-outline">Edit</button>
                                            {Number(acc.tx_count) === 0 ? (
                                                <button onClick={() => confirmDelete(acc.id)} className="btn btn-xs btn-error btn-outline">Delete</button>
                                            ) : (
                                                <span className="text-xs text-gray-400" title="Cannot delete: Used in transactions">In Use ({acc.tx_count})</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <ConfirmModal
                    isOpen={!!deleteId}
                    title="Delete Account"
                    message="Are you sure you want to delete this account? It must have no transactions to be deleted."
                    onConfirm={handleDeleteAccount}
                    onCancel={() => setDeleteId(null)}
                />
            </div>
        </div>
    );
}
