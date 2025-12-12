"use client";
import { useToaster } from '@/components/Toaster';
import ConfirmModal from '@/components/ConfirmModal';
import { useState, useEffect, useCallback } from 'react';
import { formatDate, getCurrencySymbol } from '@/lib/utils';
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

    // Load filter options
    useEffect(() => {
        Promise.all([
            fetch('/api/categories').then(r => r.json()),
            fetch('/api/accounts').then(r => r.json())
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
    const [rowsPerPage, setRowsPerPage] = useState(1000);

    // Modal State
    const [deleteId, setDeleteId] = useState(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    const fetchTransactions = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (dateRange.from) params.append('from', dateRange.from);
        if (dateRange.to) params.append('to', dateRange.to);
        if (filters.categoryId) params.append('category_id', filters.categoryId);
        if (filters.subcategoryId) params.append('subcategory_id', filters.subcategoryId);
        if (filters.accountId) params.append('account_id', filters.accountId);

        fetch(`/api/transactions?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                setTransactions(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, [dateRange, filters]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]); // Refetch when fetchTransactions changes (which changes when dateRange changes)

    const sortData = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        setTransactions(prev => [...prev].sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];

            if (key === 'amount' || key === 'original_amount') {
                aVal = parseFloat(aVal || 0);
                bVal = parseFloat(bVal || 0);
            } else {
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
        setEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/transactions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingTransaction)
            });
            if (!res.ok) throw new Error('Failed');
            success('Transaction updated');
            setEditModalOpen(false);
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
    const totalPages = Math.ceil(transactions.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    const totalSum = transactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const [importing, setImporting] = useState(false);

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

    if (loading) return <div>Loading...</div>;

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex flex-col gap-4 mb-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <h2 className="card-title">
                            Transactions History
                            <span className={`ml-2 text-lg font-mono ${totalSum < 0 ? 'text-error' : 'text-success'}`}>
                                (Total: {totalSum.toLocaleString()} ֏)
                            </span>
                        </h2>
                        <button className="btn btn-primary btn-sm" onClick={() => setImportModalOpen(true)}>
                            Import CSV
                        </button>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap gap-2 items-end bg-base-200 p-2 rounded-lg">
                        <div className="form-control w-32 md:w-40">
                            <label className="label py-0"><span className="label-text text-xs">From</span></label>
                            <CustomDatePicker
                                value={dateRange.from}
                                onChange={(val) => setDateRange({ ...dateRange, from: val })}
                                size="small"
                            />
                        </div>
                        <div className="form-control w-32 md:w-40">
                            <label className="label py-0"><span className="label-text text-xs">To</span></label>
                            <CustomDatePicker
                                value={dateRange.to}
                                onChange={(val) => setDateRange({ ...dateRange, to: val })}
                                size="small"
                            />
                        </div>

                        <div className="form-control w-32 md:w-40">
                            <label className="label py-0"><span className="label-text text-xs">Category</span></label>
                            <CustomSelect
                                options={[{ value: '', label: 'All' }, ...categories.map(c => ({ value: c.id, label: c.name, color: c.color }))]}
                                value={filters.categoryId}
                                onChange={(val) => setFilters({ ...filters, categoryId: val, subcategoryId: '' })}
                                placeholder="All"
                                size="small"
                            />
                        </div>

                        <div className="form-control w-32 md:w-40">
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

                        <div className="form-control w-32 md:w-40">
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

                <div className="overflow-x-auto">
                    {/* ... (table code skipped) ... */}
                    <table className="table table-xs md:table-sm">
                        {/* ... (table content) ... */}
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
                                <th className="cursor-pointer hover:bg-base-200 transition-colors" onClick={() => sortData('amount')}>Amount (AMD) {getSortIcon('amount')}</th>
                                <th className="cursor-pointer hover:bg-base-200 transition-colors" onClick={() => sortData('original_amount')}>Original {getSortIcon('original_amount')}</th>
                                <th className="cursor-pointer hover:bg-base-200 transition-colors" onClick={() => sortData('category_name')}>Category {getSortIcon('category_name')}</th>
                                <th className="cursor-pointer hover:bg-base-200 transition-colors" onClick={() => sortData('subcategory_name')}>Subcategory {getSortIcon('subcategory_name')}</th>
                                <th className="cursor-pointer hover:bg-base-200 transition-colors" onClick={() => sortData('account_name')}>Account {getSortIcon('account_name')}</th>
                                <th className="cursor-pointer hover:bg-base-200 transition-colors" onClick={() => sortData('note')}>Note {getSortIcon('note')}</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTransactions.map(tx => (
                                <tr key={tx.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            checked={selectedIds.includes(tx.id)}
                                            onChange={() => toggleSelect(tx.id)}
                                        />
                                    </td>
                                    <td className="whitespace-nowrap">{formatDate(tx.created_at)}</td>
                                    <td
                                        className={`font-mono font-bold ${Number(tx.amount) < 0 ? 'text-error' : 'text-success'}`}
                                    >
                                        {Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })} ֏
                                    </td>
                                    <td className="font-mono text-xs text-base-content/70">
                                        {tx.original_amount ? `${Number(tx.original_amount).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${getCurrencySymbol(tx.original_currency || tx.currency)}` : '-'}
                                    </td>
                                    <td>
                                        <div
                                            className="badge badge-outline font-bold"
                                            style={{
                                                borderColor: tx.category_color || '#ccc',
                                                color: tx.category_color || 'inherit',
                                                backgroundColor: tx.category_color ? `${tx.category_color}10` : 'transparent' // 10% opacity bg
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
                                    <td className="max-w-xs truncate" title={tx.note}>{tx.note}</td>
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
                            ))}
                            {paginatedTransactions.length === 0 && <tr><td colSpan="9" className="text-center opacity-50 py-4">No transactions found</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Rows per page:</span>
                        <div className="w-24">
                            <CustomSelect
                                options={[
                                    { value: 1000, label: '1000' },
                                    { value: 5000, label: '5000' },
                                    { value: 10000, label: '10000' },
                                    { value: transactions.length, label: 'All' }
                                ]}
                                value={rowsPerPage}
                                onChange={(val) => { setRowsPerPage(Number(val)); setCurrentPage(1); }}
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
                {importModalOpen && (
                    <dialog className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg">Import Transactions</h3>

                            {!importResult ? (
                                <form onSubmit={handleImport} className="py-4 flex flex-col gap-4">
                                    <div className="alert alert-info text-xs">
                                        <span>
                                            <b>Target columns:</b> date (DD-Mon-YYYY, e.g. 10-Dec-2025), amount, currency (ISO3), category, subcategory, account, note.<br />
                                            Rows with unknown categories/accounts will be skipped.
                                        </span>
                                        <a
                                            href={`data:text/csv;charset=utf-8,${encodeURIComponent("date,amount,currency,category,subcategory,account,note\n10-Dec-2025,1500,AMD,Food,Groceries,Cash,Lunch")}`}
                                            download="transaction_template.csv"
                                            className="link link-primary font-bold "
                                        >
                                            Download Template
                                        </a>
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
                    </dialog>
                )}

                {/* Edit Modal */}
                {editModalOpen && editingTransaction && (
                    <dialog className="modal modal-open">
                        <div className="modal-box">
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
                                        type="number"
                                        className="input input-bordered"
                                        value={editingTransaction.amount}
                                        onChange={e => setEditingTransaction({ ...editingTransaction, amount: e.target.value })}
                                    />
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
                    </dialog>
                )}

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
