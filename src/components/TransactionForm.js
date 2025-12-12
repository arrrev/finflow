import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToaster } from './Toaster';
import CustomSelect from './CustomSelect';

export default function TransactionForm({ onSuccess, prefill, onPrefillUsed }) {
    const router = useRouter();
    const { success, error: toastError } = useToaster();

    // Dynamic lists
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);

    const [form, setForm] = useState({
        amount: '',
        type: 'expense',
        categoryId: '',
        subcategoryId: '',
        account: '', // Stores Name
        accountId: '', // Stores ID
        note: '',
        date: new Date().toISOString().slice(0, 10)
    });
    // ... 
    // (Wait I need to target chunks correctly)

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let categoriesData = [];
        let accountsData = [];

        // Fetch Categories
        fetch('/api/categories').then(res => res.json()).then(data => {
            categoriesData = data;
            setCategories(data);

            // Apply initial category and its default account after both are loaded
            if (data.length > 0 && accountsData.length > 0) {
                const firstCat = data[0];
                const updates = {
                    category: firstCat.name,
                    categoryId: firstCat.id
                };

                // Auto-select default account if configured
                if (firstCat.default_account_id) {
                    const defaultAcc = accountsData.find(a => a.id == firstCat.default_account_id);
                    if (defaultAcc) {
                        updates.account = defaultAcc.name;
                        updates.accountId = defaultAcc.id;
                        updates.currency = defaultAcc.default_currency || 'AMD';
                    }
                }

                setForm(prev => ({ ...prev, ...updates }));
            } else if (data.length > 0) {
                setForm(prev => ({
                    ...prev,
                    category: data[0].name,
                    categoryId: data[0].id
                }));
            }
        });

        // Fetch Accounts
        fetch('/api/accounts').then(res => res.json()).then(data => {
            accountsData = data;
            setAccounts(data);

            // Apply default account if category was already loaded
            if (categoriesData.length > 0 && data.length > 0) {
                const firstCat = categoriesData[0];
                if (firstCat.default_account_id) {
                    const defaultAcc = data.find(a => a.id == firstCat.default_account_id);
                    if (defaultAcc) {
                        setForm(prev => ({
                            ...prev,
                            account: defaultAcc.name,
                            accountId: defaultAcc.id,
                            currency: defaultAcc.default_currency || 'AMD'
                        }));
                        return; // Don't set first account if default is found
                    }
                }
            }

            // Fallback to first account if no default
            if (data.length > 0) {
                setForm(prev => ({
                    ...prev,
                    account: data[0].name,
                    accountId: data[0].id,
                    currency: data[0].default_currency || 'AMD'
                }));
            }
        });
    }, []);

    const handleAccountChange = (accId) => {
        const acc = accounts.find(a => a.id == accId);
        if (acc) {
            setForm(prev => ({
                ...prev,
                account: acc.name,
                accountId: acc.id,
                currency: acc.default_currency || 'AMD'
            }));
        }
    };

    const handleCategoryChange = (catId) => {
        const cat = categories.find(c => c.id == catId);
        if (cat) {
            setForm(prev => {
                const newData = {
                    ...prev,
                    categoryId: cat.id,
                    category: cat.name,
                    subcategoryId: '' // reset subcat
                };

                // Auto-select Default Account if configured
                if (cat.default_account_id) {
                    const defaultAcc = accounts.find(a => a.id == cat.default_account_id);
                    if (defaultAcc) {
                        newData.account = defaultAcc.name;
                        newData.accountId = defaultAcc.id;
                        newData.currency = defaultAcc.default_currency || 'AMD';
                    }
                }

                return newData;
            });
        }
    };

    const [type, setType] = useState('expense'); // 'expense' or 'income'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let finalAmount = parseFloat(form.amount);
            if (type === 'expense' && finalAmount > 0) finalAmount = -finalAmount;
            if (type === 'income' && finalAmount < 0) finalAmount = Math.abs(finalAmount);

            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: finalAmount,
                    currency: form.currency,
                    category_id: form.categoryId,
                    account_id: form.accountId,
                    note: form.note,
                    subcategory_id: form.subcategoryId || null,
                    date: form.date
                })
            });

            if (!res.ok) throw new Error('Failed to save transaction');

            setForm(prev => ({
                ...prev,
                amount: '',
                note: '',
                subcategoryId: '',
                date: new Date().toISOString().slice(0, 10)
            }));

            router.refresh();
            if (onSuccess) onSuccess();
            success('Transaction saved!');
        } catch (err) {
            toastError(err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const selectedCategory = categories.find(c => c.id == form.categoryId);

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

                    {/* Amount & Currency Merged */}
                    <div>
                        <label className="label"><span className="label-text">Amount</span></label>
                        <div className="join w-full">
                            <div className="join-item w-28">
                                <CustomSelect
                                    options={[
                                        { value: 'AMD', label: '֏' },
                                        { value: 'USD', label: '$' },
                                        { value: 'EUR', label: '€' }
                                    ]}
                                    value={form.currency}
                                    onChange={(val) => setForm({ ...form, currency: val })}
                                    searchable={false}
                                />
                            </div>
                            <div className="relative w-full">
                                {type === 'expense' && <span className="absolute left-3 top-3 text-lg font-bold text-gray-400 z-10">-</span>}
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    className={`input input-bordered join-item w-full text-lg ${type === 'expense' ? 'pl-8' : ''}`}
                                    value={form.amount}
                                    onChange={(e) => {
                                        // Remove commas, allow only digits and one decimal dot
                                        const val = e.target.value.replace(/,/g, '');
                                        if (/^\d*\.?\d*$/.test(val)) {
                                            setForm({ ...form, amount: val });
                                        }
                                    }}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="label"><span className="label-text">Category</span></label>
                        <CustomSelect
                            options={categories.map(c => ({ label: c.name, value: c.id, color: c.color }))}
                            value={form.categoryId}
                            onChange={handleCategoryChange}
                            placeholder="Select Category"
                        />
                    </div>

                    {/* Subcategory */}
                    <div>
                        <label className="label"><span className="label-text">Subcategory</span></label>
                        <CustomSelect
                            options={selectedCategory?.subcategories?.map(s => ({ label: s.name, value: s.id })) || []}
                            value={form.subcategoryId}
                            onChange={(val) => setForm({ ...form, subcategoryId: val })}
                            placeholder={selectedCategory?.subcategories?.length ? "Select Subcategory" : "- None -"}
                            disabled={!selectedCategory?.subcategories?.length}
                        />
                    </div>

                    {/* Account */}
                    <div>
                        <label className="label"><span className="label-text">Account</span></label>
                        <CustomSelect
                            options={accounts.map(a => ({ label: a.name, value: a.id, color: a.color }))}
                            value={form.accountId}
                            onChange={handleAccountChange}
                            placeholder="Select Account"
                        />
                    </div>

                    {/* Note */}
                    <div>
                        <label className="label"><span className="label-text">Note</span></label>
                        <textarea
                            className="textarea textarea-bordered w-full"
                            placeholder="Description..."
                            value={form.note}
                            onChange={(e) => setForm({ ...form, note: e.target.value })}
                        ></textarea>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="label"><span className="label-text">Date</span></label>
                        <input
                            type="date"
                            className="input input-bordered w-full"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                        />
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
