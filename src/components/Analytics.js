"use client";
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TransferModal from './TransferModal';

export default function Analytics({ data: initialData }) {
    const [viewMode, setViewMode] = useState('month'); // 'month', 'year', 'range'
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [year, setYear] = useState(new Date().getFullYear().toString()); // YYYY
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const fetchData = async () => {
            setLoading(true);
            let query = '';
            if (viewMode === 'month') query = `month=${month}`;
            else if (viewMode === 'year') query = `month=${year}`;
            else if (viewMode === 'range' && dateRange.from && dateRange.to) query = `from=${dateRange.from}&to=${dateRange.to}`;
            else if (viewMode === 'range') {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/analytics?${query}`);
                const d = await res.json();
                if (active) {
                    setData(d);
                    setLoading(false);
                }
            } catch (e) {
                if (active) setLoading(false);
            }
        };

        fetchData();
        return () => { active = false; };
    }, [month, year, viewMode, dateRange, refreshTrigger]);

    if (loading && !data) return <div>Loading Analytics...</div>;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
                <div className="join">
                    <button className={`join-item btn btn-sm ${viewMode === 'month' ? 'btn-active' : ''}`} onClick={() => setViewMode('month')}>Month</button>
                    <button className={`join-item btn btn-sm ${viewMode === 'year' ? 'btn-active' : ''}`} onClick={() => setViewMode('year')}>Year</button>
                    <button className={`join-item btn btn-sm ${viewMode === 'range' ? 'btn-active' : ''}`} onClick={() => setViewMode('range')}>Range</button>
                </div>

                {viewMode === 'month' && (
                    <input type="month" className="input input-bordered input-sm" value={month} onChange={e => setMonth(e.target.value)} />
                )}
                {viewMode === 'year' && (
                    <select className="select select-bordered select-sm" value={year} onChange={e => setYear(e.target.value)} >
                        {[0, 1, 2, 3, 4].map(i => {
                            const y = new Date().getFullYear() - i;
                            return <option key={y} value={y}>{y}</option>;
                        })}
                    </select>
                )}
                {viewMode === 'range' && (
                    <div className="flex gap-2">
                        <input type="date" className="input input-bordered input-sm" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} />
                        <span className="self-center">-</span>
                        <input type="date" className="input input-bordered input-sm" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">

                {/* Account Balances */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="card-title">Account Balances</h2>
                            <button className="btn btn-sm btn-outline btn-primary" onClick={() => setShowTransferModal(true)}>Transfer</button>
                        </div>
                        <div className="overflow-x-auto max-h-60">
                            <table className="table table-xs md:table-sm">
                                <thead>
                                    <tr>
                                        <th>Account</th>
                                        <th className="text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.accountBalances?.map((acc) => {
                                        const getCurrencySymbol = (currency) => {
                                            const symbols = { 'AMD': '֏', 'USD': '$', 'EUR': '€' };
                                            return symbols[currency] || currency;
                                        };

                                        return (
                                            <tr key={acc.account}>
                                                <td>
                                                    <div className="font-bold">{acc.account}</div>
                                                </td>
                                                <td className="text-right font-mono">
                                                    <div className={acc.balance < 0 ? 'text-error' : 'text-success'}>
                                                        {getCurrencySymbol('AMD')} {Number(acc.balance).toLocaleString()}
                                                    </div>
                                                    {acc.currency !== 'AMD' && (
                                                        <div className="text-xs opacity-70">
                                                            ≈ {getCurrencySymbol(acc.currency)} {Number(acc.original_balance).toLocaleString()}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {(!data?.accountBalances || data.accountBalances.length === 0) && (
                                        <tr><td colSpan="2" className="text-center">No data</td></tr>
                                    )}
                                </tbody>
                                {data?.accountBalances?.length > 0 && (
                                    <tfoot>
                                        <tr className="border-t-2">
                                            <td className="font-semibold text-sm">Total Available</td>
                                            <td className="text-right font-mono">
                                                <div className="text-sm font-semibold">
                                                    ֏ {data.accountBalances.reduce((sum, acc) => sum + Number(acc.balance), 0).toLocaleString()}
                                                </div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                    <TransferModal
                        isOpen={showTransferModal}
                        onClose={() => setShowTransferModal(false)}
                        onSuccess={() => setRefreshTrigger(p => p + 1)}
                    />
                </div>

                {/* Pie Chart */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body flex items-center justify-center">
                        <h2 className="card-title w-full">Expenses Distribution</h2>
                        {data?.categoryTotals?.length > 0 ? (
                            <div className="w-full h-64 flex justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.categoryTotals.map(d => ({ ...d, value: Math.abs(d.total) }))}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="category"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}%`}
                                        >
                                            {data.categoryTotals.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="text-center py-10 opacity-50">No expenses for this period</div>
                        )}
                    </div>
                </div>

                {/* Planned vs Spent */}
                {data?.plannedVsSpent?.length > 0 && (
                    <div className="card bg-base-100 shadow-xl md:col-span-2">
                        <div className="card-body">
                            <h2 className="card-title">Planned vs Spent</h2>
                            <div className="grid gap-4">
                                {data?.plannedVsSpent?.map((item) => {
                                    // If no plan but there's spending, consider it as over budget (100%)
                                    const percent = item.planned !== 0
                                        ? Math.abs((item.spent / item.planned) * 100)
                                        : (item.spent !== 0 ? 100 : 0);
                                    const isOver = item.planned === 0
                                        ? item.spent !== 0
                                        : Math.abs(item.spent) > Math.abs(item.planned);
                                    return (
                                        <div key={item.category} className="flex flex-col gap-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-bold">{item.category}</span>
                                                <span>
                                                    <span className={isOver ? 'text-error' : ''}>{Number(item.spent).toLocaleString()}</span>
                                                    <span className="opacity-50"> / {Number(item.planned).toLocaleString()}</span>
                                                </span>
                                            </div>
                                            <div className="w-full bg-base-200 rounded-full h-2.5 dark:bg-gray-700">
                                                <div
                                                    className={`h-2.5 rounded-full ${isOver ? 'bg-error' : 'bg-primary'}`}
                                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                                ></div>
                                            </div>
                                            {(item.planned !== 0 || item.spent !== 0) && (
                                                <div className="text-xs text-right opacity-70">
                                                    {item.planned === 0 && item.spent !== 0
                                                        ? `Unplanned spending: ${Math.abs(item.spent).toLocaleString()}`
                                                        : isOver
                                                            ? `Over by ${Math.abs(item.spent - item.planned).toLocaleString()}`
                                                            : `Left: ${Math.abs(item.planned - item.spent).toLocaleString()}`
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
