"use client";
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TransferModal from './TransferModal';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import CustomMonthPicker from './CustomMonthPicker';
import { getCurrencySymbol } from '@/lib/utils';

export default function Analytics({ data: initialData, onRefresh, refreshTrigger = 0 }) {
    const [viewMode, setViewMode] = useState('month'); // 'month', 'year', 'range'
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [year, setYear] = useState(new Date().getFullYear().toString()); // YYYY
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [activeTab, setActiveTab] = useState('balances');

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Detect theme
    useEffect(() => {
        const checkTheme = () => {
            const theme = document.documentElement.getAttribute('data-theme');
            setIsDarkMode(theme === 'finflow');
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        let active = true;
        let timeoutId = null;

        const fetchData = async () => {
            // Cancel previous timeout if exists
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            // Debounce rapid changes
            timeoutId = setTimeout(async () => {
                if (!active) return;

                setLoading(true);
                let query = '';
                if (viewMode === 'month') query = `month=${month}`;
                else if (viewMode === 'year') query = `month=${year}`;
                else if (viewMode === 'range' && dateRange.from && dateRange.to) query = `from=${dateRange.from}&to=${dateRange.to}`;
                else if (viewMode === 'range') {
                    if (active) setLoading(false);
                    return;
                }

                try {
                    const res = await fetch(`/api/analytics?${query}`, {
                        cache: 'no-store' // Ensure fresh data
                    });
                    const d = await res.json();
                    if (active) {
                        setData(d);
                        setLoading(false);
                    }
                } catch (e) {
                    console.error('Error fetching analytics:', e);
                    if (active) setLoading(false);
                }
            }, 200); // 200ms debounce for analytics
        };

        fetchData();
        
        return () => { 
            active = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        };
    }, [month, year, viewMode, dateRange.from, dateRange.to, refreshTrigger]);

    if (loading && !data) return <div>Loading Analytics...</div>;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

    return (
        <div>
            {/* Mobile Tabs */}
            <div className="tabs tabs-boxed mb-4 md:hidden">
                <button type="button" className={`tab ${activeTab === 'balances' ? 'tab-active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('balances'); }}>Balances</button>
                <button type="button" className={`tab ${activeTab === 'expenses' ? 'tab-active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('expenses'); }}>Dist.</button>
                <button type="button" className={`tab ${activeTab === 'planning' ? 'tab-active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('planning'); }}>Plan</button>
            </div>

            <div className="grid grid-cols-1 gap-6">

                {/* Account Balances */}
                <div className={`card bg-base-100 shadow-xl relative z-10 ${(activeTab === 'balances' || typeof window === 'undefined') ? 'block' : 'hidden md:block'}`}>
                    <div className="card-body p-4 md:p-6">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="card-title">Account Balances</h2>
                            <button className="btn btn-sm btn-outline btn-primary" onClick={() => setShowTransferModal(true)}>Transfer</button>
                        </div>
                        <div className="overflow-x-auto">
                            {/* Totals Summary */}
                            <div className="mb-4 p-4 bg-base-200 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm font-semibold">Total Available:</div>
                                    <div className="text-xl font-bold font-mono">
                                        {getCurrencySymbol('AMD')} {Number(data?.totalAvailable || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-1 opacity-70">
                                    <div className="text-xs">Total Balance:</div>
                                    <div className="text-sm font-mono">
                                        {getCurrencySymbol('AMD')} {Number(data?.totalBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                            </div>

                            <table className="table table-xs md:table-sm">
                                <thead>
                                    <tr>
                                        <th>Account</th>
                                        <th className="text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.accountBalances?.map((acc) => {


                                        return (
                                            <tr key={acc.account}>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color || '#ccc' }}></div>
                                                        <div className="font-bold">{acc.account}</div>
                                                    </div>
                                                </td>
                                                <td className="text-right font-mono">
                                                    <div className={acc.balance < 0 ? 'text-error' : 'text-success'}>
                                                        {getCurrencySymbol('AMD')} {Number(acc.balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </div>
                                                    {acc.currency !== 'AMD' && (
                                                        <div className="text-xs opacity-70">
                                                            ≈ {getCurrencySymbol(acc.currency)} {Number(acc.original_balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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

                            </table>
                        </div>
                    </div>
                    <TransferModal
                        isOpen={showTransferModal}
                        onClose={() => setShowTransferModal(false)}
                        onSuccess={() => {
                            if (onRefresh) onRefresh();
                        }}
                    />
                </div>

                {/* Analytics Date Selector - Hidden for Balances tab */}
                {activeTab !== 'balances' && (
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
                    <div className="join">
                        <button className={`join-item btn btn-sm ${viewMode === 'month' ? 'btn-active' : ''}`} onClick={() => setViewMode('month')}>Month</button>
                        <button className={`join-item btn btn-sm ${viewMode === 'year' ? 'btn-active' : ''}`} onClick={() => setViewMode('year')}>Year</button>
                        <button className={`join-item btn btn-sm ${viewMode === 'range' ? 'btn-active' : ''}`} onClick={() => setViewMode('range')}>Range</button>
                    </div>

                    {viewMode === 'month' && (
                        <div className="w-44">
                            <CustomMonthPicker
                                value={month}
                                onChange={setMonth}
                                size="small"
                            />
                        </div>
                    )}
                    {viewMode === 'year' && (
                        <div className="w-32">
                            <CustomSelect
                                options={[0, 1, 2, 3, 4].map(i => {
                                    const y = new Date().getFullYear() - i;
                                    return { value: y.toString(), label: y.toString() };
                                })}
                                value={year}
                                onChange={(val) => setYear(val)}
                                searchable={false}
                            />
                        </div>
                    )}
                    {viewMode === 'range' && (
                        <div className="flex gap-2 items-center">
                            <div className="w-40">
                                <CustomDatePicker
                                    value={dateRange.from}
                                    onChange={(val) => setDateRange({ ...dateRange, from: val })}
                                    size="small"
                                />
                            </div>
                            <span>-</span>
                            <div className="w-40">
                                <CustomDatePicker
                                    value={dateRange.to}
                                    onChange={(val) => setDateRange({ ...dateRange, to: val })}
                                    size="small"
                                />
                            </div>
                        </div>
                    )}
                </div>
                )}

                {/* Pie Chart */}
                <div className={`card bg-base-100 shadow-xl ${(activeTab === 'expenses' || typeof window === 'undefined') ? 'block' : 'hidden md:block'}`}>
                    <div className="card-body p-4 md:p-6 flex items-center justify-center">
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
                                            stroke={isDarkMode ? '#1e293b' : '#ffffff'}
                                            strokeWidth={2}
                                            dataKey="value"
                                            nameKey="category"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}%`}
                                        >
                                            {data.categoryTotals.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })} />
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
                    <div className={`card bg-base-100 shadow-xl ${(activeTab === 'planning' || typeof window === 'undefined') ? 'block' : 'hidden md:block'}`}>
                        <div className="card-body p-4 md:p-6">
                            <h2 className="card-title">Planned vs Spent</h2>

                            {/* Summary Totals */}
                            <div className="bg-base-200 rounded-lg p-4 mb-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div>
                                        <div className="text-xs opacity-70">Total Planned</div>
                                        <div className="text-lg font-bold">
                                            ֏ {data.plannedVsSpent.reduce((sum, item) => sum + Math.abs(item.planned), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs opacity-70">Total Spent</div>
                                        <div className="text-lg font-bold text-warning">
                                            ֏ {data.plannedVsSpent.reduce((sum, item) => sum + Math.abs(item.spent), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs opacity-70">Total Overspent</div>
                                        <div className="text-lg font-bold text-error">
                                            ֏ {data.plannedVsSpent.reduce((sum, item) => {
                                                const over = Math.abs(item.spent) > Math.abs(item.planned)
                                                    ? Math.abs(item.spent) - Math.abs(item.planned)
                                                    : 0;
                                                return sum + over;
                                            }, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs opacity-70">Yet to Spend</div>
                                        <div className="text-lg font-bold text-success">
                                            ֏ {(() => {
                                                const totalPlanned = data.plannedVsSpent.reduce((sum, item) => sum + Math.abs(item.planned), 0);
                                                const totalSpent = data.plannedVsSpent.reduce((sum, item) => sum + Math.abs(item.spent), 0);
                                                const totalOverspent = data.plannedVsSpent.reduce((sum, item) => {
                                                    const over = Math.abs(item.spent) > Math.abs(item.planned)
                                                        ? Math.abs(item.spent) - Math.abs(item.planned)
                                                        : 0;
                                                    return sum + over;
                                                }, 0);
                                                const yetToSpend = totalPlanned - totalSpent + totalOverspent;
                                                return yetToSpend.toLocaleString(undefined, { maximumFractionDigits: 0 });
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

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
                                        <div key={item.category} className="flex flex-col gap-2 p-3 border border-base-200 rounded-xl bg-base-50/50 shadow-sm">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-bold">{item.category}</span>
                                                <span>
                                                    <span className={isOver ? 'text-error' : ''}>{Number(item.spent).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                    <span className="opacity-50"> / {Number(item.planned).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
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
                                                        ? `Unplanned spending: ${Math.abs(item.spent).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                                        : isOver
                                                            ? `Over by ${Math.abs(item.spent - item.planned).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                                            : `Left: ${Math.abs(item.planned - item.spent).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
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
