"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ConfirmModal from '@/components/ConfirmModal';
import ColorPalette from '@/components/ColorPalette';
import { useToaster } from '@/components/Toaster';
import CustomSelect from '@/components/CustomSelect';
import { getCurrencyOptions, getCurrencySymbol, getAllCurrencyCodes, getCurrencyByCountry } from '@/lib/currencies';

export default function AccountsPage() {
    const { success, error } = useToaster();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rates, setRates] = useState({ USD: 381.77, EUR: 447.7 }); // Default rates
    const [allCurrencies] = useState(getCurrencyOptions(getAllCurrencyCodes()));
    const [defaultCurrency, setDefaultCurrency] = useState('USD'); // Will be detected

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newAccName, setNewAccName] = useState('');
    const [newAccColor, setNewAccColor] = useState('#fbbf24');
    const [newAccCurrency, setNewAccCurrency] = useState('USD');
    const [newAccInitialBalance, setNewAccInitialBalance] = useState(0);
    const [newAccIsAvailable, setNewAccIsAvailable] = useState(true);

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
        // Fetch current exchange rates
        fetch('/api/rates')
            .then(res => res.json())
            .then(data => setRates(data))
            .catch(err => console.error('Failed to fetch rates:', err));
        
        // Detect user's location currency
        if (typeof window !== 'undefined' && 'Intl' in window) {
            try {
                // Try to detect from timezone
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const countryMap = {
                    'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US',
                    'America/Toronto': 'CA', 'America/Mexico_City': 'MX', 'America/Sao_Paulo': 'BR',
                    'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Rome': 'IT',
                    'Europe/Madrid': 'ES', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE',
                    'Europe/Vienna': 'AT', 'Europe/Zurich': 'CH', 'Europe/Stockholm': 'SE',
                    'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Warsaw': 'PL',
                    'Europe/Istanbul': 'TR', 'Europe/Moscow': 'RU',
                    'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN', 'Asia/Hong_Kong': 'HK',
                    'Asia/Singapore': 'SG', 'Asia/Seoul': 'KR', 'Asia/Dubai': 'AE',
                    'Asia/Riyadh': 'SA', 'Asia/Kolkata': 'IN', 'Asia/Jerusalem': 'IL',
                    'Asia/Yerevan': 'AM',
                    'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU',
                    'Pacific/Auckland': 'NZ'
                };
                
                const country = countryMap[timezone];
                if (country) {
                    const detectedCurrency = getCurrencyByCountry(country);
                    setDefaultCurrency(detectedCurrency);
                    setNewAccCurrency(detectedCurrency);
                }
            } catch (e) {
                console.error('Error detecting currency:', e);
            }
        }
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
                    default_currency: newAccCurrency,
                    initial_balance: parseFloat(newAccInitialBalance) || 0,
                    is_available: newAccIsAvailable
                })
            });
            if (!res.ok) throw new Error('Failed');
            success('Account created');
            setNewAccName('');
            setNewAccInitialBalance(0);
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

    // Handle ESC key for Edit Modal
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && editingAcc) {
                setEditingAcc(null);
            }
        };
        if (editingAcc) {
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [editingAcc]);

    // Handle ESC key for Add Modal
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isAddModalOpen) {
                setIsAddModalOpen(false);
            }
        };
        if (isAddModalOpen) {
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [isAddModalOpen]);

    const handleEditAccount = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/accounts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editingAcc,
                    initial_balance: parseFloat(editingAcc.initial_balance) || 0
                })
            });
            if (!res.ok) throw new Error('Failed');
            success('Account updated');
            setEditingAcc(null);
            fetchAccounts();
        } catch (e) { error('Update failed'); }
    }

    // getCurrencySymbol is now imported from currencies.js

    if (loading) return <div>Loading...</div>;

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-4 md:p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="card-title">Account Management</h2>
                    <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>+ Add Account</button>
                </div>

                {/* Edit Modal */}
                {editingAcc && (typeof window !== 'undefined' ? createPortal(
                    <dialog className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) setEditingAcc(null); }}>
                        <div className="modal-box w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
                            <h3 className="font-bold text-lg">Edit Account</h3>
                            <form onSubmit={handleEditAccount} className="py-4 flex flex-col gap-4">
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Name</span></label>
                                    <input type="text" className="input input-bordered w-full" value={editingAcc.name} onChange={e => setEditingAcc({ ...editingAcc, name: e.target.value })} />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Initial Balance</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input input-bordered w-full"
                                        value={editingAcc.initial_balance}
                                        onChange={e => setEditingAcc({ ...editingAcc, initial_balance: e.target.value })}
                                    />
                                    <label className="label"><span className="label-text-alt text-gray-500">Starting balance before transactions</span></label>
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
                                        options={allCurrencies}
                                        value={editingAcc.default_currency}
                                        onChange={(val) => setEditingAcc({ ...editingAcc, default_currency: val })}
                                        searchable={true}
                                    />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label cursor-pointer">
                                        <span className="label-text">Include in Available Balance</span>
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-primary"
                                            checked={editingAcc.is_available !== false}
                                            onChange={e => setEditingAcc({ ...editingAcc, is_available: e.target.checked })}
                                        />
                                    </label>
                                </div>
                                <div className="modal-action">
                                    <button type="button" className="btn" onClick={() => setEditingAcc(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save</button>
                                </div>
                            </form>
                        </div>
                    </dialog>,
                    document.body
                ) : null)}

                {/* Add Account Modal */}
                {isAddModalOpen && (typeof window !== 'undefined' ? createPortal(
                    <dialog className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) setIsAddModalOpen(false); }}>
                        <div className="modal-box w-11/12 max-w-lg" onClick={(e) => e.stopPropagation()}>
                            <h3 className="font-bold text-lg">Add New Account</h3>
                            <form onSubmit={handleAddAccount} className="py-4 flex flex-col gap-4">
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Name</span></label>
                                    <input type="text" className="input input-bordered w-full" value={newAccName} onChange={e => setNewAccName(e.target.value)} required />
                                </div>
                                <div className="form-control w-full">
                                    <label className="label"><span className="label-text">Initial Balance</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input input-bordered w-full"
                                        value={newAccInitialBalance}
                                        onChange={e => setNewAccInitialBalance(e.target.value)}
                                    />
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
                                        options={allCurrencies}
                                        value={newAccCurrency}
                                        onChange={(val) => setNewAccCurrency(val)}
                                        searchable={true}
                                    />
                                    <label className="label">
                                        <span className="label-text-alt text-base-content/60">
                                            Select from all available currencies. Enable more in Settings → Currencies.
                                        </span>
                                    </label>
                                </div>
                                <div className="form-control w-full">
                                    <label className="label cursor-pointer">
                                        <span className="label-text">Include in Available Balance</span>
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-primary"
                                            checked={newAccIsAvailable}
                                            onChange={e => setNewAccIsAvailable(e.target.checked)}
                                        />
                                    </label>
                                </div>
                                <div className="modal-action">
                                    <button type="button" className="btn" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Add</button>
                                </div>
                            </form>
                        </div>
                    </dialog>,
                    document.body
                ) : null)}

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
                                                <span>{Number(acc.balance_amd || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} ֏</span>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span>
                                                        {/* Show balance in original currency */}
                                                        {Number(acc.balance_native || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} {getCurrencySymbol(acc.default_currency)}
                                                    </span>
                                                    <span className="text-xs opacity-70">≈ {Number(acc.balance_amd || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} ֏</span>
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
