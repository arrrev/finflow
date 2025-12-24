"use client";
import React, { useState, useEffect, useRef } from 'react';
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
    const isSubmittingRef = useRef(false);

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
        
        // Prevent duplicate submissions
        if (isSubmittingRef.current || loading) {
            return;
        }
        
        isSubmittingRef.current = true;
        setLoading(true);
        setError('');

        if (sameAccount) {
            setError("Cannot transfer to the same account.");
            setLoading(false);
            isSubmittingRef.current = false;
            return;
        }

        try {
            const res = await fetch('/api/transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromAccountId: formData.fromAccountId,
                    toAccountId: formData.toAccountId,
                    amount: Math.round(parseFloat(formData.amount) || 0),
                    toAmount: isDifferentCurrency ? Math.round(parseFloat(formData.toAmount) || 0) : Math.round(parseFloat(formData.amount) || 0),
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
            isSubmittingRef.current = false;
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
                className="modal-box w-11/12 max-w-2xl max-h-[90vh] relative p-0 flex flex-col overflow-hidden" 
                style={{ zIndex: 100000 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-base-100 z-10 border-b border-base-300 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center flex-shrink-0">
                    <h3 className="font-bold text-lg">Transfer Money</h3>
                    <button 
                        className="btn btn-sm btn-circle btn-ghost" 
                        onClick={onClose}
                        aria-label="Close"
                        disabled={loading}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
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
                                type="text"
                                inputMode="decimal"
                                className="input input-bordered"
                                required
                                value={formData.amount}
                                onChange={e => {
                                    const val = e.target.value.replace(/[^0-9]/g, ''); // Remove everything except digits
                                    setFormData({ ...formData, amount: val });
                                }}
                            />
                        </div>

                        {isDifferentCurrency && (
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text">Received Amount {toAccount ? `(${toAccount.default_currency})` : ''}</span>
                                </label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="input input-bordered"
                                    required
                                    value={formData.toAmount}
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^0-9]/g, ''); // Remove everything except digits
                                        setFormData({ ...formData, toAmount: val });
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Date */}
                    <div className="form-control overflow-visible">
                        <CustomDatePicker
                            value={formData.date}
                            onChange={(val) => setFormData({ ...formData, date: val })}
                            label="Date"
                        />
                    </div>

                        <div className="flex justify-end mt-4 pt-4 border-t border-base-300">
                            <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={loading}>
                                {loading ? <span className="loading loading-spinner"></span> : 'Transfer'}
                            </button>
                        </div>
                    </form>
                </div>
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
