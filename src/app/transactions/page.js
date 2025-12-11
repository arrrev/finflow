"use client";
import { useToaster } from '@/components/Toaster';
import ConfirmModal from '@/components/ConfirmModal';
import { useState, useEffect, useCallback } from 'react';
import { formatDate, getCurrencySymbol } from '@/lib/utils';

export default function TransactionsPage() {
    const { success, error } = useToaster();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

    // Default to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const [dateRange, setDateRange] = useState({
        from: firstDay.toISOString().split('T')[0],
        to: lastDay.toISOString().split('T')[0]
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(1000);

    // Modal State
    const [deleteId, setDeleteId] = useState(null);

    const fetchTransactions = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        // params.append('all', 'true'); // Not strictly used by new API but fine
        if (dateRange.from) params.append('from', dateRange.from);
        if (dateRange.to) params.append('to', dateRange.to);

        fetch(`/api/transactions?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                setTransactions(data);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, [dateRange]);

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

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    // Pagination calculations
    const totalPages = Math.ceil(transactions.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                    <h2 className="card-title">Transactions History</h2>
                    <div className="flex gap-2 items-center">
                        <span className="text-sm">Filter:</span>
                        <input
                            type="date"
                            className="input input-bordered input-sm"
                            value={dateRange.from}
                            onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
                        />
                        <span>-</span>
                        <input
                            type="date"
                            className="input input-bordered input-sm"
                            value={dateRange.to}
                            onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="table table-xs md:table-sm">
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
                                    <td className={`font-mono font-bold ${Number(tx.amount) < 0 ? 'text-error' : 'text-success'}`}>
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
                        <select
                            className="select select-bordered select-sm"
                            value={rowsPerPage}
                            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        >
                            <option value={1000}>1000</option>
                            <option value={5000}>5000</option>
                            <option value={10000}>10000</option>
                            <option value={transactions.length}>All</option>
                        </select>
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
