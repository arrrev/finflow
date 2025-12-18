"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToaster } from './Toaster';
import CustomSelect from './CustomSelect';
import NumberInputProtection from './NumberInputProtection';
import CustomDatePicker from './CustomDatePicker';

export default function TransactionForm({ onSuccess, hideTitle = false }) {
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
        currency: 'AMD', // Default currency
        note: '',
        date: new Date().toISOString().slice(0, 10)
    });
    // ... 
    // (Wait I need to target chunks correctly)

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch Categories and Accounts in parallel for better performance
        Promise.all([
            fetch('/api/categories').then(res => res.json()),
            fetch('/api/accounts').then(res => res.json())
        ]).then(([categoriesData, accountsData]) => {
            setCategories(categoriesData);
            setAccounts(accountsData);

            // Apply initial category and its default account
            if (categoriesData.length > 0 && accountsData.length > 0) {
                const firstCat = categoriesData[0];
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
                } else {
                    // Fallback to first account
                    updates.account = accountsData[0].name;
                    updates.accountId = accountsData[0].id;
                    updates.currency = accountsData[0].default_currency || 'AMD';
                }

                setForm(prev => ({ ...prev, ...updates }));
            } else if (categoriesData.length > 0) {
                setForm(prev => ({
                    ...prev,
                    category: categoriesData[0].name,
                    categoryId: categoriesData[0].id
                }));
            } else if (accountsData.length > 0) {
                setForm(prev => ({
                    ...prev,
                    account: accountsData[0].name,
                    accountId: accountsData[0].id,
                    currency: accountsData[0].default_currency || 'AMD'
                }));
            }
        }).catch(err => {
            console.error('Error fetching categories/accounts:', err);
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
    const [calculatedAmount, setCalculatedAmount] = useState(null);
    const [expressionMode, setExpressionMode] = useState(false); // false = numeric mode, true = expression mode

    // Safely evaluate mathematical expressions
    const evaluateExpression = (expression) => {
        try {
            // Remove all whitespace
            let cleaned = expression.replace(/\s/g, '');
            
            // Check if it contains operators
            if (!/[\+\-\*\/]/.test(cleaned)) {
                // No operators, just parse as number
                const num = parseFloat(cleaned) || 0;
                // In expense mode, make first number negative if positive
                return type === 'expense' && num > 0 ? -num : num;
            }

            // Validate: only allow digits, operators (+, -, *, /), and parentheses (no decimal points)
            if (!/^[\d\+\-\*\/\(\)\s]+$/.test(cleaned)) {
                return null; // Invalid characters
            }

            // In expense mode, if the first number is positive, make it negative
            if (type === 'expense') {
                // Match the first number in the expression (could be at start or after operators)
                const firstNumberMatch = cleaned.match(/^(\d+)/);
                if (firstNumberMatch) {
                    // First number is positive, prepend minus sign
                    cleaned = '-' + cleaned;
                }
                // If it already starts with '-', leave it as is
            }

            // Use Function constructor for safe evaluation (safer than eval)
            // This only evaluates mathematical expressions, not arbitrary code
            // Round the result to ensure no decimals
            const result = Math.round(Function(`"use strict"; return (${cleaned})`)());
            
            // Check if result is a valid number
            if (typeof result !== 'number' || !isFinite(result)) {
                return null;
            }
            
            return result;
        } catch (error) {
            return null;
        }
    };

    // Calculate amount when input changes
    const handleAmountChange = (e) => {
        let val = e.target.value.replace(/,/g, '');
        
        if (expressionMode) {
            // Expression mode: allow digits, operators, and parentheses (no decimal points)
            val = val.replace(/\./g, ''); // Remove decimal points
            if (/^[\d\+\-\*\/\(\)\s]*$/.test(val)) {
                setForm({ ...form, amount: val });
                
                // Try to evaluate if it contains operators
                if (/[\+\-\*\/]/.test(val) && val.length > 0) {
                    const result = evaluateExpression(val);
                    setCalculatedAmount(result);
                } else {
                    setCalculatedAmount(null);
                }
            }
        } else {
            // Numeric mode: only allow digits
            val = val.replace(/[^0-9]/g, '');
            setForm({ ...form, amount: val });
            setCalculatedAmount(null);
            // Auto-switch to expression mode if user types an operator (though they shouldn't be able to with numeric keyboard)
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Evaluate expression if it contains operators
            let finalAmount;
            if (/[\+\-\*\/]/.test(form.amount)) {
                const evaluated = evaluateExpression(form.amount);
                if (evaluated === null || isNaN(evaluated)) {
                    throw new Error('Invalid expression. Please check your calculation.');
                }
                finalAmount = evaluated;
            } else {
                finalAmount = Math.round(parseFloat(form.amount) || 0);
                // Apply sign based on transaction type for simple numbers
                if (type === 'expense' && finalAmount > 0) finalAmount = -finalAmount;
                if (type === 'income' && finalAmount < 0) finalAmount = Math.abs(finalAmount);
            }

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

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'Failed to save transaction');
            }

            setForm(prev => ({
                ...prev,
                amount: '',
                note: '',
                subcategoryId: '',
                date: new Date().toISOString().slice(0, 10)
            }));
            setCalculatedAmount(null);
            setExpressionMode(false); // Reset to numeric mode

            // Don't use router.refresh() as it causes page reload
            // The onSuccess callback will trigger data refresh in parent components
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
        <div className={`w-full ${hideTitle ? '' : 'card bg-base-100 shadow-xl'}`}>
            <div className={hideTitle ? 'w-full' : 'card-body p-4 md:p-6'}>
                {!hideTitle && <h2 className="card-title text-lg md:text-xl">Add Transaction</h2>}

                {/* Expense/Income Toggle */}
                <div className="flex justify-center mb-2">
                    <div className="join">
                        <button
                            type="button"
                            className={`join-item btn btn-sm ${type === 'expense' ? 'btn-passover-red' : 'btn-outline'}`}
                            onClick={() => setType('expense')}
                        >
                            Expense (-)
                        </button>
                        <button
                            type="button"
                            className={`join-item btn btn-sm ${type === 'income' ? 'btn-success text-white' : 'btn-outline'}`}
                            onClick={() => setType('income')}
                        >
                            Income (+)
                        </button>
                    </div>
                </div>

                {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}
                <form onSubmit={handleSubmit} className={`form-control ${hideTitle ? 'gap-3 sm:gap-4' : 'gap-4'}`}>

                    {/* Amount & Currency */}
                    <div>
                        <label className="label">
                            <span className="label-text">Amount</span>
                        </label>
                        <div className="join w-full">
                            <div className="join-item w-20 bg-base-200 flex items-center justify-center px-2 border border-base-300 rounded-l-lg">
                                <span className="text-sm font-semibold">{form.currency || 'AMD'}</span>
                            </div>
                            <div className="relative flex-1">
                                {type === 'expense' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 z-10 pointer-events-none">-</span>}
                                <input
                                    type="text"
                                    inputMode={expressionMode ? "text" : "numeric"}
                                    pattern={expressionMode ? undefined : "[0-9]*"}
                                    placeholder="Input Amount"
                                    className={`input input-bordered join-item w-full text-lg ${type === 'expense' ? 'pl-8' : ''} ${expressionMode ? 'pr-12' : 'pr-12'}`}
                                    value={form.amount}
                                    onChange={handleAmountChange}
                                    onBlur={() => {
                                        // When user leaves the field, replace expression with calculated result
                                        if (calculatedAmount !== null && calculatedAmount !== undefined) {
                                            setForm({ ...form, amount: Math.round(calculatedAmount).toString() });
                                            setCalculatedAmount(null);
                                            setExpressionMode(false); // Switch back to numeric mode
                                        }
                                    }}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs"
                                    onClick={() => setExpressionMode(!expressionMode)}
                                    title={expressionMode ? "Switch to Numbers" : "Switch to Expressions"}
                                >
                                    {expressionMode ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        {calculatedAmount !== null && (
                            <div className="text-sm text-primary font-semibold mt-1 ml-1">
                                = {calculatedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                        )}
                        <label className="label">
                            <span className="label-text-alt text-base-content/60">
                                💡 Tip: Use math expressions like <code className="bg-base-200 px-1 rounded">10000-3000+9000</code> or <code className="bg-base-200 px-1 rounded">500*2</code>
                            </span>
                        </label>
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
                            rows={2}
                        ></textarea>
                    </div>

                    {/* Date */}
                    <div>
                        <CustomDatePicker
                            value={form.date}
                            onChange={(val) => setForm({ ...form, date: val })}
                            label="Date"
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
