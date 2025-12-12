"use client";
import { useToaster } from '@/components/Toaster';
import ConfirmModal from '@/components/ConfirmModal';
import { useState, useEffect, useCallback } from 'react';
import { formatDate, getCurrencySymbol } from '@/lib/utils';
import CustomSelect from '@/components/CustomSelect';

export default function TransactionsPage() {
    const { success, error } = useToaster();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

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
            if (!res.ok) throw new Error('Failed');
            success('Transaction deleted');
            fetchTransactions();
        } catch (e) {
            error('Failed to delete transaction');
        } finally {
            setDeleteId(null);
        }
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
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap gap-2 items-end bg-base-200 p-2 rounded-lg">
                        <div className="form-control w-32 md:w-40">
                            <label className="label py-0"><span className="label-text text-xs">From</span></label>
                            <input type="date" className="input input-bordered w-full" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} />
                        </div>
                        <div className="form-control w-32 md:w-40">
                            <label className="label py-0"><span className="label-text text-xs">To</span></label>
                            <input type="date" className="input input-bordered w-full" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} />
                        </div>

                        <div className="form-control w-32 md:w-40">
                            <label className="label py-0"><span className="label-text text-xs">Category</span></label>
                            <CustomSelect
                                options={[{ value: '', label: 'All' }, ...categories.map(c => ({ value: c.id, label: c.name, color: c.color }))]}
                                value={filters.categoryId}
                                onChange={(val) => setFilters({ ...filters, categoryId: val, subcategoryId: '' })}
                                placeholder="All"
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
                            />
                        </div>

                        <div className="form-control w-32 md:w-40">
                            <label className="label py-0"><span className="label-text text-xs">Account</span></label>
                            <CustomSelect
                                options={[{ value: '', label: 'All' }, ...accounts.map(a => ({ value: a.id, label: a.name, color: a.color }))]}
                                value={filters.accountId}
                                onChange={(val) => setFilters({ ...filters, accountId: val })}
                                placeholder="All"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {/* ... (table code skipped) ... */}
                    <table className="table table-xs md:table-sm">
                        {/* ... (table content) ... */}
                        <thead>
                            <tr className="select-none text-base-content">
                                <th className="cursor-pointer hover:bg-base-200 transition-colors" onClick={() => sortData('created_at')}>Date {getSortIcon('created_at')}</th>
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
                                    <td>{formatDate(tx.created_at)}</td>
                                    <td
                                        className={`font-mono font-bold cursor-pointer hover:bg-base-200 ${Number(tx.amount) < 0 ? 'text-error' : 'text-success'}`}
                                        onClick={() => openEditModal(tx)}
                                        title="Click to edit"
                                    >
                                        {Number(tx.amount).toLocaleString()} ֏
                                    </td>
                                    <td className="font-mono text-xs text-base-content/70">
                                        {tx.original_amount ? `${Number(tx.original_amount).toLocaleString()} ${getCurrencySymbol(tx.original_currency || tx.currency)}` : '-'}
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
                                        <button onClick={() => confirmDelete(tx.id)} className="btn btn-ghost btn-xs text-error">✕</button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedTransactions.length === 0 && <tr><td colSpan="8" className="text-center opacity-50 py-4">No transactions found</td></tr>}
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

                {/* Edit Modal */}
                {editModalOpen && editingTransaction && (
                    <dialog className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg">Edit Transaction</h3>
                            <form onSubmit={handleUpdate} className="py-4 flex flex-col gap-4">
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Date</span></label>
                                    <input
                                        type="date"
                                        className="input input-bordered"
                                        value={editingTransaction.created_at ? editingTransaction.created_at.slice(0, 10) : ''}
                                        onChange={e => setEditingTransaction({ ...editingTransaction, created_at: e.target.value })}
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
            </div>
        </div>
    );
}
