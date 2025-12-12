"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { formatDate, getCurrencySymbol } from '@/lib/utils';
import CustomSelect from './CustomSelect';


export default function TransactionList() {
    const [transactions, setTransactions] = useState([]);
    const [sortBy, setSortBy] = useState('created_at');
    const [order, setOrder] = useState('DESC');
    const [filterType, setFilterType] = useState('none'); // none, category_name, account_name
    const [filterValue, setFilterValue] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(1000);

    const fetchTransactions = useCallback(async () => {
        let url = `/api/transactions/list?sortBy=${sortBy}&order=${order}`;
        if (filterType !== 'none' && filterValue) {
            url += `&filterType=${filterType}&filterValue=${filterValue}`;
        }

        try {
            const res = await fetch(url);
            const data = await res.json();
            setTransactions(data);
            setCurrentPage(1); // Reset to page 1 on fetch
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    }, [sortBy, order, filterType, filterValue]);

    const [categoriesList, setCategoriesList] = useState([]);
    const [accountsList, setAccountsList] = useState([]);

    const fetchFilters = useCallback(async () => {
        try {
            // Fetch Categories
            const catRes = await fetch('/api/categories');
            const catData = await catRes.json();
            setCategoriesList(catData);

            // Fetch Accounts
            const accRes = await fetch('/api/accounts');
            const accData = await accRes.json();
            setAccountsList(accData);
        } catch (e) { console.error("Filter fetch error", e); }
    }, []);

    useEffect(() => {
        fetchFilters();
        fetchTransactions();
    }, [fetchTransactions, fetchFilters]);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    const handleSort = (field) => {
        if (sortBy === field) {
            setOrder(order === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortBy(field);
            setOrder('DESC');
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
            // success('Transaction updated'); // No toaster in this component currently
            setEditModalOpen(false);
            fetchTransactions();
        } catch (e) {
            console.error('Failed to update transaction', e);
        }
    };

    // Pagination Logic
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = transactions.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(transactions.length / rowsPerPage);

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title justify-between flex-wrap gap-2">
                    <span>Transactions <span className="text-sm font-normal opacity-50">({transactions.length})</span></span>

                    <div className="flex flex-wrap gap-2 text-sm font-normal items-center">
                        {/* Filters */}
                        <div className="w-32">
                            <CustomSelect
                                options={[
                                    { value: 'none', label: 'No Filter' },
                                    { value: 'category_name', label: 'Category' },
                                    { value: 'account_name', label: 'Account' }
                                ]}
                                value={filterType}
                                onChange={(val) => { setFilterType(val); setFilterValue(''); }}
                                searchable={false}
                            />
                        </div>

                        {filterType === 'category_name' && (
                            <div className="w-48">
                                <CustomSelect
                                    options={[{ value: '', label: 'All Categories' }, ...categoriesList.map(c => ({ value: c.name, label: c.name, color: c.color }))]}
                                    value={filterValue}
                                    onChange={(val) => setFilterValue(val)}
                                    placeholder="Select Category"
                                />
                            </div>
                        )}

                        {filterType === 'account_name' && (
                            <div className="w-48">
                                <CustomSelect
                                    options={[{ value: '', label: 'All Accounts' }, ...accountsList.map(a => ({ value: a.name, label: a.name, color: a.color }))]}
                                    value={filterValue}
                                    onChange={(val) => setFilterValue(val)}
                                    placeholder="Select Account"
                                />
                            </div>
                        )}
                    </div>
                </h2>

                <div className="overflow-x-auto">
                    <table className="table table-zebra table-sm">
                        <thead>
                            <tr className="cursor-pointer hover:bg-base-200">
                                <th onClick={() => handleSort('created_at')}>Date {sortBy === 'created_at' && (order === 'ASC' ? '↑' : '↓')}</th>
                                <th onClick={() => handleSort('category_name')}>Category {sortBy === 'category_name' && (order === 'ASC' ? '↑' : '↓')}</th>
                                <th onClick={() => handleSort('account_name')}>Account {sortBy === 'account_name' && (order === 'ASC' ? '↑' : '↓')}</th>
                                <th onClick={() => handleSort('note')}>Note {sortBy === 'note' && (order === 'ASC' ? '↑' : '↓')}</th>
                                <th onClick={() => handleSort('amount')} className="text-right">Amount {sortBy === 'amount' && (order === 'ASC' ? '↑' : '↓')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRows.map((t) => (
                                <tr key={t.id}>
                                    <td>{formatDate(t.created_at)}</td>
                                    <td>
                                        <div
                                            className="badge badge-md text-white border-0"
                                            style={{ backgroundColor: t.category_color || '#ccc' }}
                                        >
                                            {t.category_name}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.account_color || '#ccc' }}></div>
                                            {t.account_name}
                                        </div>
                                    </td>
                                    <td className="text-gray-500 text-xs truncate max-w-xs" title={t.note}>{t.note}</td>
                                    <td
                                        className={`text-right font-mono font-bold cursor-pointer hover:bg-base-200 ${t.amount < 0 ? 'text-error' : 'text-success'}`}
                                        onClick={() => openEditModal(t)}
                                        title="Click to edit"
                                    >
                                        {Number(t.amount).toLocaleString()} <span className="text-xs text-gray-400">{getCurrencySymbol(t.currency)}</span>
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr><td colSpan="5" className="text-center py-4">No transactions found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <span>Show:</span>
                        <div className="w-24">
                            <CustomSelect
                                options={[
                                    { value: 1000, label: '1000' },
                                    { value: 5000, label: '5000' },
                                    { value: 10000, label: '10000' },
                                    { value: 'all', label: 'All' }
                                ]}
                                value={rowsPerPage === transactions.length ? 'all' : rowsPerPage}
                                onChange={(val) => {
                                    setRowsPerPage(val === 'all' ? transactions.length : Number(val));
                                    setCurrentPage(1);
                                }}
                                searchable={false}
                            />
                        </div>
                        <span>rows</span>
                    </div>

                    <div className="join">
                        <button className="join-item btn btn-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>«</button>
                        <button className="join-item btn btn-sm btn-disabled">Page {currentPage} of {Math.max(1, totalPages)}</button>
                        <button className="join-item btn btn-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>»</button>
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
            </div>
        </div>
    );
}
