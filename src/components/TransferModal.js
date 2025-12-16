"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ColorSelect from './ColorSelect';
import CustomDatePicker from './CustomDatePicker';

export default function TransferModal({ isOpen, onClose, onSuccess }) {
    const [accounts, setAccounts] = useState([]);
    const [formData, setFormData] = useState({
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        toAmount: '', // Used if currencies differ
        date: new Date().toISOString().slice(0, 10)
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch accounts
    useEffect(() => {
        if (isOpen) {
            fetch('/api/accounts').then(res => res.json()).then(setAccounts);
            // Reset form
            setFormData({
                fromAccountId: '',
                toAccountId: '',
                amount: '',
                toAmount: '',
                date: new Date().toISOString().slice(0, 10)
            });
            setError('');
        }
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        
        // Prevent body scroll locking
        if (isOpen) {
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
        }
        
        return () => {
            window.removeEventListener('keydown', handleEsc);
            if (!isOpen) {
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
            }
        };
    }, [isOpen, onClose]);

    const fromAccount = accounts.find(a => a.id == formData.fromAccountId);
    const toAccount = accounts.find(a => a.id == formData.toAccountId);

    const isDifferentCurrency = fromAccount && toAccount && fromAccount.default_currency !== toAccount.default_currency;
    const sameAccount = formData.fromAccountId && formData.toAccountId && formData.fromAccountId === formData.toAccountId;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (sameAccount) {
            setError("Cannot transfer to the same account.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromAccountId: formData.fromAccountId,
                    toAccountId: formData.toAccountId,
                    amount: formData.amount,
                    toAmount: isDifferentCurrency ? formData.toAmount : formData.amount,
                    date: formData.date
                })
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || 'Transfer failed');
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const modalContent = (
        <div className="modal modal-open" onClick={handleBackdropClick}>
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                style={{ zIndex: 99999 }}
                onClick={handleBackdropClick}
            />
            <div 
                className="modal-box w-11/12 max-w-2xl relative" 
                style={{ zIndex: 100000 }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="font-bold text-lg mb-4">Transfer Money</h3>

                {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                    {/* From Account */}
                    <div className="form-control">
                        <label className="label"><span className="label-text">From Account</span></label>
                        <ColorSelect
                            options={accounts.map(a => ({ label: `${a.name} (${a.default_currency || 'AMD'})`, value: a.id, color: a.color }))}
                            value={formData.fromAccountId}
                            onChange={(val) => setFormData({ ...formData, fromAccountId: val })}
                            placeholder="Select Source Account"
                        />
                    </div>

                    {/* To Account */}
                    <div className="form-control">
                        <label className="label"><span className="label-text">To Account</span></label>
                        <ColorSelect
                            options={accounts.map(a => ({ label: `${a.name} (${a.default_currency || 'AMD'})`, value: a.id, color: a.color }))}
                            value={formData.toAccountId}
                            onChange={(val) => setFormData({ ...formData, toAccountId: val })}
                            placeholder="Select Destination Account"
                        />
                    </div>

                    {/* Amount(s) */}
                    <div className="flex gap-4">
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">Amount {fromAccount ? `(${fromAccount.default_currency})` : ''}</span>
                            </label>
                            <input
                                type="number"
                                step="any"
                                className="input input-bordered"
                                required
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>

                        {isDifferentCurrency && (
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text">Received Amount {toAccount ? `(${toAccount.default_currency})` : ''}</span>
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    className="input input-bordered"
                                    required
                                    value={formData.toAmount}
                                    onChange={e => setFormData({ ...formData, toAmount: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    {/* Date */}
                    <div className="form-control">
                        <CustomDatePicker
                            value={formData.date}
                            onChange={(val) => setFormData({ ...formData, date: val })}
                            label="Date"
                        />
                    </div>

                    <div className="modal-action">
                        <button type="button" className="btn" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="loading loading-spinner"></span> : 'Transfer'}
                        </button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </div>
    );

    // Render modal at document root level to avoid positioning issues
    if (typeof window !== 'undefined') {
        return createPortal(modalContent, document.body);
    }
    
    return modalContent;
}
