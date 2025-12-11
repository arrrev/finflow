"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToaster } from './Toaster';

export default function TransactionForm(props) {
    const router = useRouter();
    const { success, error: showError } = useToaster();

    // Dynamic lists
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);

    const [formData, setFormData] = useState({
        amount: '',
        currency: 'AMD',
        category: '', // Stores Name
        categoryId: '', // Stores ID
        subcategoryId: '',
        account: '', // Stores Name
        accountId: '', // Stores ID
        note: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch Categories
        fetch('/api/categories').then(res => res.json()).then(data => {
            setCategories(data);
            if (data.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    category: data[0].name,
                    categoryId: data[0].id
                }));
            }
        });

        // Fetch Accounts
        fetch('/api/accounts').then(res => res.json()).then(data => {
            setAccounts(data);
            if (data.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    account: data[0].name,
                    accountId: data[0].id,
                    currency: data[0].default_currency || 'AMD'
                }));
            }
        });
    }, []);

    const handleAccountChange = (accName) => {
        const acc = accounts.find(a => a.name === accName);
        setFormData(prev => ({
            ...prev,
            account: accName,
            accountId: acc ? acc.id : '',
            currency: acc ? (acc.default_currency || 'AMD') : 'AMD'
        }));
    };

    const handleCategoryChange = (catId) => {
        const cat = categories.find(c => c.id == catId);
        if (cat) {
            setFormData(prev => ({
                ...prev,
                categoryId: cat.id,
                category: cat.name,
                subcategoryId: '' // reset subcat
            }));
        }
    };

    const [type, setType] = useState('expense'); // 'expense' or 'income'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let finalAmount = parseFloat(formData.amount);
            if (type === 'expense' && finalAmount > 0) finalAmount = -finalAmount;
            if (type === 'income' && finalAmount < 0) finalAmount = Math.abs(finalAmount);

            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: finalAmount,
                    currency: formData.currency,
                    category_id: formData.categoryId,
                    account_id: formData.accountId,
                    note: formData.note,
                    subcategory_id: formData.subcategoryId || null
                })
            });

            if (!res.ok) throw new Error('Failed to save transaction');

            setFormData(prev => ({
                ...prev,
                amount: '',
                note: '',
                subcategoryId: ''
            }));

            router.refresh();
            if (props.onSuccess) props.onSuccess();
            success('Transaction saved!');
        } catch (err) {
            showError(err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const selectedCategory = categories.find(c => c.id == formData.categoryId);

    return (
        <div className="card w-full bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title">Add Transaction</h2>

                {/* Expense/Income Toggle */}
                <div className="flex justify-center mb-2">
                    <div className="join">
                        <button
                            className={`join-item btn btn-sm ${type === 'expense' ? 'btn-error text-white' : 'btn-outline'}`}
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

                {error && <div className="alert alert-error"><span>{error}</span></div>}
                <form onSubmit={handleSubmit} className="form-control gap-4">

                    {/* Amount & Currency */}
                    <div className="flex gap-4">
                        <div className="w-2/3">
                            <label className="label"><span className="label-text">Amount</span></label>
                            <div className="relative">
                                {type === 'expense' && <span className="absolute left-3 top-3 text-lg font-bold text-gray-400">-</span>}
                                <span className={`absolute left-3 top-3 text-lg font-bold text-gray-400 ${type === 'expense' ? 'hidden' : 'hidden'}`}>+</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className={`input input-bordered w-full ${type === 'expense' ? 'pl-8' : ''}`}
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="w-1/3">
                            <label className="label"><span className="label-text">Currency</span></label>
                            <select
                                className="select select-bordered w-full"
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            >
                                <option value="AMD">֏ AMD</option>
                                <option value="USD">$ USD</option>
                                <option value="EUR">€ EUR</option>
                            </select>
                        </div>
                    </div>

                    {/* Category & Subcategory */}
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="label"><span className="label-text">Category</span></label>
                            <div className="flex gap-2 items-center">
                                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: selectedCategory?.color || '#ccc' }}></div>
                                <select
                                    className="select select-bordered w-full"
                                    value={formData.categoryId}
                                    onChange={(e) => handleCategoryChange(e.target.value)}
                                >
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="w-1/2">
                            <label className="label"><span className="label-text">Subcategory</span></label>
                            <select
                                className="select select-bordered w-full"
                                value={formData.subcategoryId}
                                onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                                disabled={!selectedCategory?.subcategories?.length}
                            >
                                <option value="">- None -</option>
                                {selectedCategory?.subcategories?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Account */}
                    <div>
                        <label className="label"><span className="label-text">Account</span></label>
                        <div className="flex gap-2 items-center">
                            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: accounts.find(a => a.name === formData.account)?.color || '#ccc' }}></div>
                            <select
                                className="select select-bordered w-full"
                                value={formData.account}
                                onChange={(e) => handleAccountChange(e.target.value)}
                            >
                                {accounts.map(a => (
                                    <option key={a.id} value={a.name}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="label"><span className="label-text">Note</span></label>
                        <textarea
                            className="textarea textarea-bordered w-full"
                            placeholder="Description..."
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="card-actions justify-end mt-4">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="loading loading-spinner"></span> : 'Save Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
