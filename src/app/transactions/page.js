"use client";
import { useToaster } from '@/components/Toaster';
import ConfirmModal from '@/components/ConfirmModal';
import TransactionForm from '@/components/TransactionForm';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { formatDate, formatTime, getCurrencySymbol } from '@/lib/utils';
import CustomSelect from '@/components/CustomSelect';
import CustomDatePicker from '@/components/CustomDatePicker';

export default function TransactionsPage() {
    const { success, error } = useToaster();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [selectedIds, setSelectedIds] = useState([]);

    // Filters Data
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [filters, setFilters] = useState({ categoryId: '', subcategoryId: '', accountId: '' });
    const [userMainCurrency, setUserMainCurrency] = useState('USD');
    const [exchangeRates, setExchangeRates] = useState({});

    // Load filter options and user preferences
    useEffect(() => {
        Promise.all([
            fetch('/api/categories').then(r => r.json()),
            fetch('/api/accounts').then(r => r.json()),
            fetch('/api/user/preferences').then(r => r.json()).then(prefs => {
                if (prefs.main_currency) {
                    setUserMainCurrency(prefs.main_currency);
                }
            }).catch(() => {}),
            fetch('/api/rates').then(r => r.json()).then(rates => {
                setExchangeRates(rates);
            }).catch(() => {})
        ]).then(([cats, accs]) => {
            setCategories(cats);
            setAccounts(accs);
        });
    }, []);

    // Default to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const [dateRange, setDateRange] = useState({
        from: `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`,
        to: `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [filtersOpen, setFiltersOpen] = useState(false); // Always start with false to avoid hydration mismatch
    
    // Set filters open by default on desktop after hydration
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            setFiltersOpen(true);
        }
    }, []);

    // Modal State
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [calculatedAmount, setCalculatedAmount] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const fetchTransactions = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (dateRange.from) params.append('from', dateRange.from);
        if (dateRange.to) params.append('to', dateRange.to);
        if (filters.categoryId) params.append('category_id', filters.categoryId);
        if (filters.subcategoryId) params.append('subcategory_id', filters.subcategoryId);
        if (filters.accountId) params.append('account_id', filters.accountId);
        
        // Always fetch all transactions for client-side pagination
        // The API will handle large datasets with a reasonable upper limit
        params.append('limit', 'all');

        fetch(`/api/transactions?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                setTransactions(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching transactions:', err);
                setLoading(false);
            });
    }, [dateRange, filters]);

    // Debounce filter changes to reduce API calls
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchTransactions();
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [fetchTransactions]);

    const sortData = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        setTransactions(prev => [...prev].sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];

            // Handle date fields - convert to Date objects for proper sorting
            if (key === 'created_at' || key === 'date') {
                aVal = aVal ? new Date(aVal).getTime() : 0;
                bVal = bVal ? new Date(bVal).getTime() : 0;
            }
            // Handle numeric fields
            else if (key === 'amount') {
                aVal = parseFloat(aVal || 0);
                bVal = parseFloat(bVal || 0);
            }
            // Handle currency field - use account_currency or currency
            else if (key === 'currency') {
                aVal = (a.account_currency || a.currency || 'USD').toString().toLowerCase();
                bVal = (b.account_currency || b.currency || 'USD').toString().toLowerCase();
            }
            // Handle text fields
            else {
                aVal = (aVal || '').toString().toLowerCase();
                bVal = (bVal || '').toString().toLowerCase();
            }

            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        }));
    };

    const confirmDelete = (id) => {
        setDeleteId(id);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/transactions?id=${deleteId}`, { method: 'DELETE' });
            if (res.ok) {
                setTransactions(prev => prev.filter(t => t.id !== deleteId));
                success('Transaction deleted');
            } else {
                error('Failed to delete transaction');
            }
        } catch (err) {
            error('Failed to delete transaction');
        }
        setDeleteId(null);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        try {
            const res = await fetch('/api/transactions/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });
            if (res.ok) {
                setTransactions(prev => prev.filter(t => !selectedIds.includes(t.id)));
                success(`${selectedIds.length} transaction(s) deleted`);
                setSelectedIds([]);
            } else {
                error('Failed to delete transactions');
            }
        } catch (err) {
            error('Failed to delete transactions');
        }
        setBulkDeleteConfirm(false);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === paginatedTransactions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(paginatedTransactions.map(t => t.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };


    const openEditModal = (tx) => {
        setEditingTransaction({ ...tx });
        setCalculatedAmount(null);
        setEditModalOpen(true);
    };

    // Safely evaluate mathematical expressions
    const evaluateExpression = (expression) => {
        try {
            // Remove all whitespace
            let cleaned = expression.replace(/\s/g, '');
            
            // Check if it contains operators
            if (!/[\+\-\*\/]/.test(cleaned)) {
                // No operators, just parse as number
                return parseFloat(cleaned) || 0;
            }

            // Validate: only allow digits, operators (+, -, *, /), and decimal points
            if (!/^[\d\+\-\*\/\.\(\)\s]+$/.test(cleaned)) {
                return null; // Invalid characters
            }

            // Use Function constructor for safe evaluation (safer than eval)
            // This only evaluates mathematical expressions, not arbitrary code
            const result = Function(`"use strict"; return (${cleaned})`)();
            
            // Check if result is a valid number
            if (typeof result !== 'number' || !isFinite(result)) {
                return null;
            }
            
            return result;
        } catch (error) {
            return null;
        }
    };

    const handleAmountChange = (e) => {
        const val = e.target.value.replace(/,/g, '');
        
        // Allow digits, operators, decimal points, and parentheses
        if (/^[\d\+\-\*\/\.\(\)\s]*$/.test(val)) {
            setEditingTransaction({ ...editingTransaction, amount: val });
            
            // Try to evaluate if it contains operators
            if (/[\+\-\*\/]/.test(val) && val.length > 0) {
                const result = evaluateExpression(val);
                setCalculatedAmount(result);
            } else {
                setCalculatedAmount(null);
            }
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            // Evaluate expression if it contains operators
            let finalAmount;
            if (/[\+\-\*\/]/.test(editingTransaction.amount)) {
                const evaluated = evaluateExpression(editingTransaction.amount);
                if (evaluated === null || isNaN(evaluated)) {
                    error('Invalid expression. Please check your calculation.');
                    return;
                }
                finalAmount = evaluated;
            } else {
                finalAmount = parseFloat(editingTransaction.amount) || 0;
            }

            const res = await fetch('/api/transactions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editingTransaction,
                    amount: finalAmount
                })
            });
            if (!res.ok) throw new Error('Failed');
            success('Transaction updated');
            setEditModalOpen(false);
            setCalculatedAmount(null);
            fetchTransactions();
        } catch (e) {
            error('Failed to update transaction');
        }
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    // Pagination calculations
    const totalPages = rowsPerPage === 'all' ? 1 : Math.ceil(transactions.length / rowsPerPage);
    const startIndex = rowsPerPage === 'all' ? 0 : (currentPage - 1) * rowsPerPage;
    const endIndex = rowsPerPage === 'all' ? transactions.length : startIndex + rowsPerPage;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    const totalSum = transactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const [importing, setImporting] = useState(false);

    // Handle ESC key for Import Modal
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && importModalOpen) {
                setImportModalOpen(false);
            }
        };
        if (importModalOpen) {
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [importModalOpen]);

    // Handle ESC key for Edit Modal
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && editModalOpen) {
                setEditModalOpen(false);
            }
        };
        if (editModalOpen) {
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [editModalOpen]);

    // Handle ESC key for Create Modal
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && createModalOpen) {
                setCreateModalOpen(false);
            }
        };
        if (createModalOpen) {
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [createModalOpen]);

    const handleImport = async (e) => {
        e.preventDefault();
        if (!importFile) return;

        setImporting(true);
        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const res = await fetch('/api/transactions/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Import failed');

            setImportResult(data);
            if (data.added > 0) {
                success(`Successfully added ${data.added} transactions`);
                fetchTransactions();
            } else if (data.skipped > 0 && data.added === 0) {
                error(`All ${data.skipped} rows were skipped due to errors`);
            }
        } catch (e) {
            console.error(e);
            error(e.message || 'Failed to import file');
        } finally {
            setImporting(false);
        }
    };

    const closeImportModal = () => {
        setImportModalOpen(false);
        setImportFile(null);
        setImportResult(null);
    };

    const handleExport = async () => {
        try {
            // Fetch ALL transactions without any filters for export
            const params = new URLSearchParams();
            params.append('limit', 'all'); // Get all transactions (no date/category/account filters)
            
            const res = await fetch(`/api/transactions?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch transactions');
            
            const allTransactions = await res.json();
            
            // Format date as YYYY-MM-DD HH:MM:SS (e.g., 2025-12-11 18:29:28)
            const formatDateForExport = (dateStr) => {
                const date = new Date(dateStr);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            };

            // CSV header
            const headers = ['date', 'amount', 'currency', 'category', 'subcategory', 'account', 'note'];
            
            // Convert transactions to CSV rows
            const csvRows = allTransactions.map(t => {
            const date = formatDateForExport(t.created_at);
            // Use account currency amount (what's stored in the database)
            const amount = t.amount;
            const currency = t.account_currency || t.currency || 'USD';
            const category = t.category_name || ''; // Already joined in the query
            const subcategory = t.subcategory_name || ''; // Already joined in the query
            const account = t.account_name || ''; // Already joined in the query
            const note = (t.note || '').replace(/"/g, '""'); // Escape quotes in CSV
            
            return [date, amount, currency, category, subcategory, account, note];
        });

        // Escape CSV values
        const escapeCSV = (value) => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        // Build CSV content
        const csvContent = [
            headers.join(','),
            ...csvRows.map(row => row.map(escapeCSV).join(','))
        ].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        // Generate filename with date range (simplified format for filename)
        const formatDateForFilename = (dateStr) => {
            if (!dateStr) return 'all';
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        // Generate filename - use "all" since we're exporting everything
        link.setAttribute('download', `transactions_all.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        success(`Exported ${allTransactions.length} transaction(s) (all transactions)`);
        } catch (err) {
            console.error('Export error:', err);
            error('Failed to export transactions');
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-4 md:p-6 relative">
                <div className="flex flex-col gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
                        <h2 className="card-title text-lg md:text-xl">
                            <span>Transactions History</span>
                            <span className={`ml-2 text-sm md:text-lg font-mono ${totalSum < 0 ? 'text-error' : 'text-success'}`}>
                                (Total: {totalSum.toLocaleString(undefined, { maximumFractionDigits: 0 })} ֏)
                            </span>
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            <button 
                                className="btn btn-success btn-sm flex-1 sm:flex-none min-w-[140px]" 
                                onClick={() => setCreateModalOpen(true)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                <span className="hidden sm:inline">Create Transaction</span>
                                <span className="sm:hidden">Create</span>
                            </button>
                            <button className="btn btn-outline btn-sm flex-1 sm:flex-none" onClick={handleExport} disabled={transactions.length === 0}>
                                Export CSV
                            </button>
                            <button className="btn btn-primary btn-sm flex-1 sm:flex-none" onClick={() => setImportModalOpen(true)}>
                                Import CSV
                            </button>
                        </div>
                    </div>

                    {/* Filters Toggle Button */}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setFiltersOpen(!filtersOpen)} 
                            className="btn btn-sm btn-outline"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                            </svg>
                            {filtersOpen ? 'Hide Filters' : 'Show Filters'}
                        </button>
                        {(filters.categoryId || filters.subcategoryId || filters.accountId) && (
                            <span className="badge badge-primary badge-sm">
                                Active
                            </span>
                        )}
                    </div>

                    {/* Filters Row */}
                    {filtersOpen && (
                    <div className="flex flex-wrap gap-2 items-end bg-base-200 p-2 md:p-3 rounded-lg">
                        <div className="form-control w-full sm:w-32 md:w-40">
                            <label className="label py-0"><span className="label-text text-xs">From</span></label>
                            <CustomDatePicker
                                value={dateRange.from}
                                onChange={(val) => setDateRange({ ...dateRange, from: val })}
                                size="small"
                            />
                        </div>
                        <div className="form-control w-full sm:w-32 md:w-40">
                            <label className="label py-0"><span className="label-text text-xs">To</span></label>
                            <CustomDatePicker
                                value={dateRange.to}
                                onChange={(val) => setDateRange({ ...dateRange, to: val })}
                                size="small"
                            />
                        </div>

                        <div className="form-control w-full sm:w-32 md:w-40">
                            <label className="label py-0"><span className="label-text text-xs">Category</span></label>
                            <CustomSelect
                                options={[{ value: '', label: 'All' }, ...categories.map(c => ({ value: c.id, label: c.name, color: c.color }))]}
                                value={filters.categoryId}
                                onChange={(val) => setFilters({ ...filters, categoryId: val, subcategoryId: '' })}
                                placeholder="All"
                                size="small"
                            />
                        </div>

                        <div className="form-control w-full sm:w-32 md:w-40">
                            <label className="label py-0"><span className="label-text text-xs">Subcategory</span></label>
                            <CustomSelect
                                options={[{ value: '', label: 'All' }, ...(categories.find(c => c.id == filters.categoryId)?.subcategories?.map(s => ({ value: s.id, label: s.name })) || [])]}
                                value={filters.subcategoryId}
                                onChange={(val) => setFilters({ ...filters, subcategoryId: val })}
                                disabled={!filters.categoryId}
                                placeholder="All"
                                size="small"
                            />
                        </div>

                        <div className="form-control w-full sm:w-32 md:w-40">
                            <label className="label py-0"><span className="label-text text-xs">Account</span></label>
                            <CustomSelect
                                options={[{ value: '', label: 'All' }, ...accounts.map(a => ({ value: a.id, label: a.name, color: a.color }))]}
                                value={filters.accountId}
                                onChange={(val) => setFilters({ ...filters, accountId: val })}
                                placeholder="All"
                                size="small"
                            />
                        </div>
                    </div>
                    )}

                    {/* Bulk Delete Button */}
                    {selectedIds.length > 0 && (
                        <div className="mt-2">
                            <button
                                className="btn btn-error btn-sm"
                                onClick={() => setBulkDeleteConfirm(true)}
                            >
                                Delete Selected ({selectedIds.length})
                            </button>
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="table table-xs md:table-sm w-full">
                        <thead>
                            <tr className="select-none text-base-content">
                                <th className="w-8">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm"
                                        checked={selectedIds.length === paginatedTransactions.length && paginatedTransactions.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="cursor-pointer hover:bg-base-200 transition-colors whitespace-nowrap" onClick={() => sortData('created_at')}>Date {getSortIcon('created_at')}</th>
                                <th className="cursor-pointer hover:bg-base-200 transition-colors" onClick={() => sortData('amount')}>Amount {getSortIcon('amount')}</th>
                                <th className="cursor-pointer hover:bg-base-200 transition-colors" onClick={() => sortData('currency')}>Currency {getSortIcon('currency')}</th>
                                <th className="cursor-pointer hover:bg-base-200 transition-colors" onClick={() => sortData('category_name')}>Category {getSortIcon('category_name')}</th>
                                <th className="cursor-pointer hover:bg-base-200 transition-colors" onClick={() => sortData('subcategory_name')}>Subcategory {getSortIcon('subcategory_name')}</th>
                                <th className="cursor-pointer hover:bg-base-200 transition-colors" onClick={() => sortData('account_name')}>Account {getSortIcon('account_name')}</th>
                                <th className="cursor-pointer hover:bg-base-200 transition-colors w-[120px]" onClick={() => sortData('note')}>Note {getSortIcon('note')}</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-20">
                                        <span className="loading loading-spinner loading-lg"></span>
                                    </td>
                                </tr>
                            ) : (
                                paginatedTransactions.map(tx => (
                                <tr key={tx.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            checked={selectedIds.includes(tx.id)}
                                            onChange={() => toggleSelect(tx.id)}
                                        />
                                    </td>
                                    <td className="whitespace-nowrap">
                                        {tx.created_at ? (
                                            <>
                                                <div>{formatDate(tx.created_at) || 'Invalid date'}</div>
                                                <div className="text-xs opacity-70">{formatTime(tx.created_at)}</div>
                                            </>
                                        ) : (
                                            <div className="text-xs opacity-50">No date</div>
                                        )}
                                    </td>
                                    <td
                                        className={`font-mono font-bold ${Number(tx.amount) < 0 ? 'text-error' : 'text-success'}`}
                                    >
                                        <div className="flex flex-col items-end">
                                            <div>
                                                <span className="mr-1">{Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span><span className="text-[10px] opacity-70">{getCurrencySymbol(tx.account_currency || tx.currency || 'USD')}</span>
                                            </div>
                                            {(() => {
                                                const txCurrency = tx.account_currency || tx.currency || 'USD';
                                                // Use stored exchange rate from transaction date, fallback to current rates
                                                const txRates = tx.exchange_rate ? (typeof tx.exchange_rate === 'string' ? JSON.parse(tx.exchange_rate) : tx.exchange_rate) : exchangeRates;
                                                if (txCurrency !== userMainCurrency && txRates[txCurrency] && txRates[userMainCurrency]) {
                                                    const amountInUSD = Number(tx.amount) / txRates[txCurrency];
                                                    const equivalentAmount = amountInUSD * txRates[userMainCurrency];
                                                    return (
                                                        <div className="text-[10px] text-gray-500 opacity-60 mt-0.5">
                                                            ≈ {Math.abs(equivalentAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })} {getCurrencySymbol(userMainCurrency)}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </td>
                                    <td className="font-mono text-xs text-base-content/70">
                                        {tx.account_currency || tx.currency || 'USD'}
                                    </td>
                                    <td>
                                        <div
                                            className="badge badge-outline font-bold"
                                            style={{
                                                borderColor: tx.category_color || '#ccc',
                                                color: tx.category_color || 'inherit',
                                                backgroundColor: tx.category_color ? `${tx.category_color}10` : 'transparent'
                                            }}
                                        >
                                            {tx.category_name}
                                        </div>
                                    </td>
                                    <td>{tx.subcategory_name || '-'}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tx.account_color || '#ccc' }}></div>
                                            {tx.account_name}
                                        </div>
                                    </td>
                                    <td className="max-w-[120px] break-words whitespace-normal text-xs" title={tx.note}>{tx.note}</td>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => openEditModal(tx)} className="btn btn-ghost btn-xs text-info" title="Edit">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                </svg>
                                            </button>
                                            <button onClick={() => confirmDelete(tx.id)} className="btn btn-ghost btn-xs text-error" title="Delete">✕</button>
                                        </div>
                                    </td>
                                </tr>
                            )))}
                            {!loading && paginatedTransactions.length === 0 && <tr><td colSpan="9" className="text-center opacity-50 py-4">No transactions found</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                    {loading && transactions.length === 0 ? (
                        <div className="card bg-base-200 shadow-sm">
                            <div className="card-body p-4 text-center py-20">
                                <span className="loading loading-spinner loading-lg"></span>
                            </div>
                        </div>
                    ) : (
                        paginatedTransactions.map(tx => (
                        <div key={tx.id} className="card bg-base-200 shadow-sm">
                            <div className="card-body p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            checked={selectedIds.includes(tx.id)}
                                            onChange={() => toggleSelect(tx.id)}
                                        />
                                        <div>
                                            {tx.created_at ? (
                                                <div className="font-semibold text-sm">{formatDate(tx.created_at) || 'Invalid date'} <span className="text-xs opacity-70 font-normal">{formatTime(tx.created_at)}</span></div>
                                            ) : (
                                                <div className="font-semibold text-sm text-xs opacity-50">No date</div>
                                            )}
                                            <div className={`font-mono font-bold text-lg ${Number(tx.amount) < 0 ? 'text-error' : 'text-success'}`}>
                                                <div className="flex flex-col">
                                                    <div>
                                                        {Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs opacity-70">{getCurrencySymbol(tx.account_currency || tx.currency || 'USD')}</span>
                                                    </div>
                                                    {(() => {
                                                        const txCurrency = tx.account_currency || tx.currency || 'USD';
                                                        // Use stored exchange rate from transaction date, fallback to current rates
                                                        const txRates = tx.exchange_rate ? (typeof tx.exchange_rate === 'string' ? JSON.parse(tx.exchange_rate) : tx.exchange_rate) : exchangeRates;
                                                        if (txCurrency !== userMainCurrency && txRates[txCurrency] && txRates[userMainCurrency]) {
                                                            const amountInUSD = Number(tx.amount) / txRates[txCurrency];
                                                            const equivalentAmount = amountInUSD * txRates[userMainCurrency];
                                                            return (
                                                                <div className="text-[10px] text-gray-500 opacity-60 mt-0.5">
                                                                    ≈ {Math.abs(equivalentAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })} {getCurrencySymbol(userMainCurrency)}
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="dropdown dropdown-end">
                                        <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-circle">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                                            </svg>
                                        </div>
                                        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[100] w-32 p-2 shadow-lg border border-base-300">
                                            <li>
                                                <button onClick={() => openEditModal(tx)} className="text-info">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                    </svg>
                                                    Edit
                                                </button>
                                            </li>
                                            <li>
                                                <button onClick={() => confirmDelete(tx.id)} className="text-error">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                    </svg>
                                                    Delete
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div className="text-xs text-base-content/70 font-mono">
                                    Currency: {tx.account_currency || tx.currency || 'USD'}
                                </div>
                                
                                <div className="flex flex-wrap gap-2 items-center">
                                    <div
                                        className="badge badge-outline font-bold text-xs flex items-center gap-1"
                                        style={{
                                            borderColor: tx.category_color || '#ccc',
                                            color: tx.category_color || 'inherit',
                                            backgroundColor: tx.category_color ? `${tx.category_color}10` : 'transparent'
                                        }}
                                    >
                                        {tx.category_name}
                                    </div>
                                    {tx.subcategory_name && (
                                        <div className="badge badge-ghost text-xs flex items-center gap-1">{tx.subcategory_name}</div>
                                    )}
                                    <div className="badge badge-outline text-xs flex items-center gap-1" style={{
                                        borderColor: tx.account_color || '#ccc',
                                        color: tx.account_color || 'inherit',
                                        backgroundColor: tx.account_color ? `${tx.account_color}10` : 'transparent'
                                    }}>
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tx.account_color || '#ccc' }}></div>
                                        <span>{tx.account_name}</span>
                                    </div>
                                </div>
                                
                                {tx.note && (
                                    <div className="text-xs text-base-content/70 break-words">{tx.note}</div>
                                )}
                            </div>
                        </div>
                    )))}
                    {!loading && paginatedTransactions.length === 0 && (
                        <div className="text-center opacity-50 py-8">No transactions found</div>
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mt-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <span className="text-sm whitespace-nowrap">Rows per page:</span>
                        <div className="w-full sm:w-24">
                            <CustomSelect
                                options={[
                                    { value: 20, label: '20' },
                                    { value: 100, label: '100' },
                                    { value: 500, label: '500' },
                                    { value: 1000, label: '1000' },
                                    { value: 'all', label: 'All' }
                                ]}
                                value={rowsPerPage}
                                onChange={(val) => { setRowsPerPage(val === 'all' ? 'all' : Number(val)); setCurrentPage(1); }}
                                searchable={false}
                            />
                        </div>
                        <span className="text-sm text-gray-500">({transactions.length} total)</span>
                    </div>
                    <div className="join">
                        <button
                            className="join-item btn btn-sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                        >
                            ««
                        </button>
                        <button
                            className="join-item btn btn-sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            «
                        </button>
                        <button className="join-item btn btn-sm btn-active">
                            Page {currentPage} of {totalPages || 1}
                        </button>
                        <button
                            className="join-item btn btn-sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                        >
                            »
                        </button>
                        <button
                            className="join-item btn btn-sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage >= totalPages}
                        >
                            »»
                        </button>
                    </div>
                </div>

                {/* Import Modal */}
                {importModalOpen && (typeof window !== 'undefined' ? createPortal(
                    <div className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) closeImportModal(); }}>
                        <div 
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                            style={{ zIndex: 99998 }}
                            onClick={(e) => { if (e.target === e.currentTarget) closeImportModal(); }}
                        />
                        <div className="modal-box relative" style={{ zIndex: 99999 }} onClick={(e) => e.stopPropagation()}>
                            <h3 className="font-bold text-lg">Import Transactions</h3>

                            {!importResult ? (
                                <form onSubmit={handleImport} className="py-4 flex flex-col gap-4">
                                    <div className="alert alert-info text-sm">
                                        <div className="flex flex-col gap-2">
                                            <div>
                                                <b>CSV Format Requirements:</b>
                                            </div>
                                            <div className="text-xs space-y-1">
                                                <div><b>Columns:</b> date, amount, currency, category, subcategory, account, note</div>
                                                <div><b>Date format:</b> YYYY-MM-DD HH:MM:SS (e.g., 2025-12-11 18:29:28)</div>
                                                <div><b>Currency:</b> ISO3 code (e.g., AMD, USD, EUR)</div>
                                                <div><b>Note:</b> Rows with unknown categories/accounts will be skipped</div>
                                            </div>
                                            <a
                                                href={`data:text/csv;charset=utf-8,${encodeURIComponent("date,amount,currency,category,subcategory,account,note\n2025-12-11 18:29:28,1500,AMD,Food,Groceries,Cash,Lunch")}`}
                                                download="transaction_template.csv"
                                                className="link link-primary font-bold text-xs"
                                            >
                                                Download Template
                                            </a>
                                        </div>
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">Select CSV File</span></label>
                                        <input
                                            type="file"
                                            accept=".csv,.xlsx"
                                            className="file-input file-input-bordered w-full"
                                            onChange={e => setImportFile(e.target.files[0])}
                                            required
                                        />
                                    </div>
                                    <div className="modal-action">
                                        <button type="button" className="btn" onClick={closeImportModal} disabled={importing}>Cancel</button>
                                        <button type="submit" className="btn btn-primary" disabled={importing || !importFile}>
                                            {importing ? <span className="loading loading-spinner"></span> : 'Upload & Import'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="py-4 flex flex-col gap-4">
                                    <div className={`alert ${importResult.added > 0 ? 'alert-success' : 'alert-warning'}`}>
                                        <div>
                                            <h4 className="font-bold">Import Complete!</h4>
                                            <p>Successfully Added: {importResult.added}</p>
                                            <p>Skipped / Invalid: {importResult.skipped}</p>
                                        </div>
                                    </div>

                                    {importResult.skippedRows && importResult.skippedRows.length > 0 && (
                                        <div className="flex flex-col gap-2">
                                            <div className="alert alert-error text-xs">
                                                <span>
                                                    {importResult.skipped} rows were skipped. Download the report to see the reasons and correct them.
                                                </span>
                                            </div>
                                            <button
                                                className="btn btn-outline btn-error btn-sm w-full"
                                                onClick={() => {
                                                    const headers = ['date', 'amount', 'currency', 'category', 'subcategory', 'account', 'note', 'failure_reason'];
                                                    const csvContent = [
                                                        headers.join(','),
                                                        ...importResult.skippedRows.map(row =>
                                                            headers.map(header => {
                                                                const val = row[header] || '';
                                                                // Escape quotes and wrap in quotes if contains comma
                                                                const escaped = String(val).replace(/"/g, '""');
                                                                return `"${escaped}"`;
                                                            }).join(',')
                                                        )
                                                    ].join('\n');

                                                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                                    const url = URL.createObjectURL(blob);
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', 'skipped_rows_report.csv');
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                            >
                                                Download Skipped Rows Report
                                            </button>
                                        </div>
                                    )}

                                    {/* Fallback for legacy error list if needed, or just remove if replaced by file */}
                                    {importResult.errors && importResult.errors.length > 0 && !importResult.skippedRows && (
                                        <div className="collapse collapse-plus bg-base-200">
                                            <input type="checkbox" />
                                            <div className="collapse-title text-sm font-medium">
                                                Show {importResult.errors.length} Error Details
                                            </div>
                                            <div className="collapse-content">
                                                <ul className="list-disc list-inside text-xs text-error max-h-40 overflow-y-auto">
                                                    {importResult.errors.map((err, idx) => (
                                                        <li key={idx}>{err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    <div className="modal-action">
                                        <button className="btn" onClick={closeImportModal}>Close</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>,
                    document.body
                ) : null)}

                {/* Edit Modal */}
                {editModalOpen && editingTransaction && (typeof window !== 'undefined' ? createPortal(
                    <dialog className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) setEditModalOpen(false); }}>
                        <div className="modal-box w-11/12 max-w-2xl" onClick={(e) => e.stopPropagation()}>
                            <h3 className="font-bold text-lg">Edit Transaction</h3>
                            <form onSubmit={handleUpdate} className="py-4 flex flex-col gap-4">
                                <div className="form-control">
                                    <CustomDatePicker
                                        value={editingTransaction.created_at ? (() => {
                                            const d = new Date(editingTransaction.created_at);
                                            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                        })() : ''}
                                        onChange={(val) => setEditingTransaction({ ...editingTransaction, created_at: val })}
                                        label="Date"
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Amount</span></label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className="input input-bordered"
                                        value={editingTransaction.amount}
                                        onChange={handleAmountChange}
                                        onBlur={() => {
                                            // When user leaves the field, replace expression with calculated result
                                            if (calculatedAmount !== null && calculatedAmount !== undefined) {
                                                setEditingTransaction({ ...editingTransaction, amount: calculatedAmount.toString() });
                                                setCalculatedAmount(null);
                                            }
                                        }}
                                    />
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
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Note</span></label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={editingTransaction.note || ''}
                                        onChange={e => setEditingTransaction({ ...editingTransaction, note: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">Category</span></label>
                                        <CustomSelect
                                            options={categories.map(c => ({ value: c.id, label: c.name, color: c.color }))}
                                            value={editingTransaction.category_id}
                                            onChange={(val) => setEditingTransaction({ ...editingTransaction, category_id: val, subcategory_id: '' })}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label"><span className="label-text">Subcategory</span></label>
                                        <CustomSelect
                                            options={categories.find(c => c.id == editingTransaction.category_id)?.subcategories?.map(s => ({ value: s.id, label: s.name })) || []}
                                            value={editingTransaction.subcategory_id}
                                            onChange={(val) => setEditingTransaction({ ...editingTransaction, subcategory_id: val })}
                                            placeholder="None"
                                        />
                                    </div>
                                </div>

                                <div className="modal-action">
                                    <button type="button" className="btn" onClick={() => setEditModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save</button>
                                </div>
                            </form>
                        </div>
                    </dialog>,
                    document.body
                ) : null)}

            {/* Create Transaction Modal */}
            {createModalOpen && (typeof window !== 'undefined' ? createPortal(
                <div className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) setCreateModalOpen(false); }}>
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                        style={{ zIndex: 99998 }}
                        onClick={(e) => { if (e.target === e.currentTarget) setCreateModalOpen(false); }}
                    />
                    <div 
                        className="modal-box w-full max-w-2xl h-full max-h-screen rounded-none sm:rounded-2xl m-0 sm:m-4 p-0 relative overflow-hidden flex flex-col" 
                        style={{ zIndex: 99999 }} 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-base-100 z-10 border-b border-base-300 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center flex-shrink-0">
                            <h3 className="font-bold text-base sm:text-lg">Create Transaction</h3>
                            <button 
                                className="btn btn-sm btn-circle btn-ghost" 
                                onClick={() => setCreateModalOpen(false)}
                                aria-label="Close"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <TransactionForm 
                                onSuccess={() => {
                                    setCreateModalOpen(false);
                                    fetchTransactions();
                                }} 
                                hideTitle={true}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            ) : null)}

                <ConfirmModal
                    isOpen={!!deleteId}
                    title="Delete Transaction"
                    message="Are you sure you want to delete this transaction? This action cannot be undone."
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteId(null)}
                />

                <ConfirmModal
                    isOpen={bulkDeleteConfirm}
                    title="Delete Multiple Transactions"
                    message={`Are you sure you want to delete ${selectedIds.length} transaction(s)? This action cannot be undone.`}
                    onConfirm={handleBulkDelete}
                    onCancel={() => setBulkDeleteConfirm(false)}
                />
            </div >
        </div >
    );
}
