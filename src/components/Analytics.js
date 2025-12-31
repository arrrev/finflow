"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TransferModal from './TransferModal';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import CustomMonthPicker from './CustomMonthPicker';
import CustomYearPicker from './CustomYearPicker';
import { getCurrencySymbol } from '@/lib/utils';

export default function Analytics({ data: initialData, onRefresh, refreshTrigger = 0 }) {
    const [viewMode, setViewMode] = useState('month'); // 'month', 'year', 'range'
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [year, setYear] = useState(new Date().getFullYear().toString()); // YYYY
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [activeTab, setActiveTab] = useState('balances');
    const [expandedCategories, setExpandedCategories] = useState(new Set());

    const [data, setData] = useState(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [userMainCurrency, setUserMainCurrency] = useState('USD');
    const [isChartFullscreen, setIsChartFullscreen] = useState(false);

    // Fetch user preferences for main currency
    useEffect(() => {
        fetch('/api/user/preferences')
            .then(res => res.json())
            .then(prefs => {
                if (prefs.main_currency) {
                    setUserMainCurrency(prefs.main_currency);
                }
            })
            .catch(err => console.error('Error fetching user preferences:', err));
    }, []);

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

            // If refreshTrigger changed, fetch immediately (no debounce for user actions)
            // Otherwise debounce for filter changes
            const shouldDebounce = refreshTrigger === 0;
            const delay = shouldDebounce ? 100 : 0;

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
                    // Add cache-busting timestamp when refresh is triggered
                    const cacheBuster = refreshTrigger > 0 ? `&_t=${Date.now()}` : '';
                    const res = await fetch(`/api/analytics?${query}${cacheBuster}`);
                    const d = await res.json();
                    if (active) {
                        setData(d);
                        setLoading(false);
                    }
                } catch (e) {
                    console.error('Error fetching analytics:', e);
                    if (active) setLoading(false);
                }
            }, delay);
        };

        // Only fetch if we don't have initial data or if refresh is triggered
        if (!initialData || refreshTrigger > 0) {
            fetchData();
        }
        
        return () => { 
            active = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        };
    }, [month, year, viewMode, dateRange.from, dateRange.to, refreshTrigger, initialData]);

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
                            <button type="button" className="btn btn-sm btn-outline btn-primary" onClick={() => setShowTransferModal(true)}>Transfer</button>
                        </div>
                        <div className="overflow-x-auto">
                            {/* Totals Summary */}
                            <div className="mb-4 p-4 bg-base-200 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm font-semibold">Total Available:</div>
                                    <div className="text-xl font-bold font-mono">
                                        {getCurrencySymbol(data?.userMainCurrency || userMainCurrency)} {Number(data?.totalAvailable || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-1 opacity-70">
                                    <div className="text-xs">Total Balance:</div>
                                    <div className="text-sm font-mono">
                                        {getCurrencySymbol(data?.userMainCurrency || userMainCurrency)} {Number(data?.totalBalance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                                                    {/* Show native balance first (account's currency) */}
                                                    <div className={acc.original_balance < 0 ? 'text-error' : 'text-success'}>
                                                        {getCurrencySymbol(acc.currency)} {Number(acc.original_balance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </div>
                                                    {/* Show converted balance if different from account currency */}
                                                    {acc.currency !== (data?.userMainCurrency || userMainCurrency) && (
                                                        <div className="text-xs opacity-70">
                                                            ≈ {getCurrencySymbol(data?.userMainCurrency || userMainCurrency)} {Number(acc.balance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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

                {/* Analytics Date Selector - Show on desktop always, on mobile only when not on balances tab */}
                <div className={`flex flex-col md:flex-row justify-between items-center mb-4 gap-2 ${activeTab === 'balances' ? 'hidden md:flex' : ''}`}>
                    <div className="join">
                        <button type="button" className={`join-item btn btn-sm ${viewMode === 'month' ? 'btn-active' : ''}`} onClick={() => setViewMode('month')}>Month</button>
                        <button type="button" className={`join-item btn btn-sm ${viewMode === 'year' ? 'btn-active' : ''}`} onClick={() => setViewMode('year')}>Year</button>
                        <button type="button" className={`join-item btn btn-sm ${viewMode === 'range' ? 'btn-active' : ''}`} onClick={() => setViewMode('range')}>Range</button>
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
                            <CustomYearPicker
                                value={year}
                                onChange={setYear}
                                size="small"
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

                {/* Pie Chart */}
                <div className={`card bg-base-100 shadow-xl ${(activeTab === 'expenses' || typeof window === 'undefined') ? 'block' : 'hidden md:block'}`}>
                    <div className="card-body p-4 md:p-6 flex items-center justify-center">
                        <div className="flex justify-between items-center w-full mb-4">
                            <h2 className="card-title">Expenses Distribution</h2>
                            {data?.categoryTotals?.length > 0 && (
                                <button
                                    onClick={() => setIsChartFullscreen(true)}
                                    className="btn btn-ghost btn-sm"
                                    title="Expand to fullscreen"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                    </svg>
                                </button>
                            )}
                        </div>
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

                {/* Fullscreen Chart Modal */}
                {isChartFullscreen && data?.categoryTotals?.length > 0 && (typeof window !== 'undefined' ? createPortal(
                    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-base-100" onClick={(e) => { if (e.target === e.currentTarget) setIsChartFullscreen(false); }} style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
                        <div className="bg-base-100 w-screen h-screen max-w-none rounded-none flex flex-col m-0 p-6 relative" style={{ width: '100vw', height: '100vh', maxWidth: '100vw', zIndex: 100001 }} onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">Expenses Distribution</h2>
                                <button
                                    onClick={() => setIsChartFullscreen(false)}
                                    className="btn btn-ghost btn-sm"
                                    title="Close fullscreen"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 w-full flex justify-center min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.categoryTotals.map(d => ({ ...d, value: Math.abs(d.total) }))}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={120}
                                            outerRadius={180}
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
                        </div>
                    </div>,
                    document.body
                ) : null)}

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
                                    // Check if category has subcategories
                                    const hasSubcategories = item.subcategories && item.subcategories.length > 0;
                                    const isExpanded = expandedCategories.has(item.category);
                                    
                                    // Calculate unplanned spending and overspending at subcategory level
                                    let unplannedSpending = 0;
                                    let totalLeft = 0;
                                    let totalOverspent = 0;
                                    if (hasSubcategories && item.subcategories) {
                                        item.subcategories.forEach(sub => {
                                            const subSpent = Math.abs(sub.total || 0);
                                            const subPlanned = Math.abs(sub.planned || 0);
                                            // If subcategory has spending but no plan, that's unplanned
                                            if (subSpent > 0 && subPlanned === 0) {
                                                unplannedSpending += subSpent;
                                            }
                                            // Calculate left and overspending for subcategories with plans
                                            if (subPlanned > 0) {
                                                const subLeft = subPlanned - subSpent;
                                                if (subLeft > 0) {
                                                    totalLeft += subLeft;
                                                } else {
                                                    // Overspent: subSpent > subPlanned
                                                    totalOverspent += Math.abs(subLeft);
                                                }
                                            }
                                        });
                                    } else {
                                        // No subcategories: simple calculation
                                        const totalSpent = Math.abs(item.spent || 0);
                                        const totalPlanned = Math.abs(item.planned || 0);
                                        const left = totalPlanned - totalSpent;
                                        if (left > 0) {
                                            totalLeft = left;
                                        } else {
                                            totalOverspent = Math.abs(left);
                                        }
                                    }
                                    
                                    // Calculate planned spending (spending that has a corresponding plan)
                                    const plannedSpending = Math.abs(item.spent) - unplannedSpending;
                                    
                                    // If no plan but there's spending, consider it as over budget (100%)
                                    const percent = item.planned !== 0
                                        ? Math.abs((plannedSpending / item.planned) * 100)
                                        : (item.spent !== 0 ? 100 : 0);
                                    const isOver = item.planned === 0
                                        ? item.spent !== 0
                                        : plannedSpending > Math.abs(item.planned);
                                    
                                    // Check if category is completed (spent equals planned, no overspending, no unplanned)
                                    const isCompleted = item.planned !== 0 && 
                                                       totalLeft === 0 && 
                                                       totalOverspent === 0 && 
                                                       unplannedSpending === 0 &&
                                                       Math.abs(Math.abs(item.spent) - Math.abs(item.planned)) < 0.01; // Account for rounding

                                    return (
                                        <div key={item.category} className={`flex flex-col gap-2 p-3 border rounded-xl shadow-sm ${isCompleted ? 'border-base-300 bg-base-200/50 opacity-60' : 'border-base-200 bg-base-50/50'}`}>
                                            <div className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    {hasSubcategories && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newExpanded = new Set(expandedCategories);
                                                                if (isExpanded) {
                                                                    newExpanded.delete(item.category);
                                                                } else {
                                                                    newExpanded.add(item.category);
                                                                }
                                                                setExpandedCategories(newExpanded);
                                                            }}
                                                            className={`btn btn-ghost btn-xs p-0 w-5 h-5 min-h-0 ${isCompleted ? 'opacity-50' : ''}`}
                                                        >
                                                            {isExpanded ? '▼' : '▶'}
                                                        </button>
                                                    )}
                                                    <span className={`font-bold ${isCompleted ? 'opacity-60' : ''}`}>{item.category}</span>
                                                </div>
                                                <span className={isCompleted ? 'opacity-60' : ''}>
                                                    <span className={isOver ? 'text-error' : ''}>
                                                        {item.spent < 0 
                                                            ? `-${Math.abs(item.spent).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                                            : Number(item.spent).toLocaleString(undefined, { maximumFractionDigits: 0 })
                                                        }
                                                    </span>
                                                    <span className="opacity-50">
                                                        {' / '}
                                                        {item.spent < 0 
                                                            ? `-${Math.abs(item.planned || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                                            : Math.abs(item.planned || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })
                                                        }
                                                    </span>
                                                </span>
                                            </div>
                                            
                                            {/* Subcategory breakdown */}
                                            {isExpanded && hasSubcategories && (
                                                <div className={`ml-7 space-y-2 border-l-2 pl-3 ${isCompleted ? 'border-base-300 opacity-50' : 'border-base-300'}`}>
                                                    {item.subcategories.map((sub) => {
                                                        const subSpentAbs = Math.abs(sub.total || 0);
                                                        const subPlannedAbs = Math.abs(sub.planned || 0);
                                                        const isExpense = (sub.total || 0) < 0;
                                                        const isOverspent = subPlannedAbs > 0 && subSpentAbs > subPlannedAbs;
                                                        const overspentAmount = isOverspent ? subSpentAbs - subPlannedAbs : 0;
                                                        const subCompleted = subPlannedAbs > 0 && Math.abs(subSpentAbs - subPlannedAbs) < 0.01 && !isOverspent;
                                                        return (
                                                            <div key={sub.subcategory} className={`flex justify-between text-xs ${isCompleted || subCompleted ? 'opacity-50' : 'opacity-80'}`}>
                                                                <span className="opacity-70">/ {sub.subcategory}</span>
                                                                <span>
                                                                    <span className={isOverspent ? 'text-error' : ''}>
                                                                        {isExpense ? '-' : ''}{subSpentAbs.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                                    </span>
                                                                    {subPlannedAbs > 0 && (
                                                                        <span className="opacity-50">
                                                                            {' / '}
                                                                            {isExpense ? '-' : ''}{subPlannedAbs.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                                        </span>
                                                                    )}
                                                                    {isOverspent && (
                                                                        <span className="text-error ml-1">
                                                                            (Over: {overspentAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            
                                            <div className={`w-full rounded-full h-2.5 dark:bg-gray-700 ${isCompleted ? 'bg-base-300' : 'bg-base-200'}`}>
                                                <div
                                                    className={`h-2.5 rounded-full ${isCompleted ? 'bg-base-400' : isOver ? 'bg-error' : 'bg-primary'}`}
                                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                                ></div>
                                            </div>
                                            {(item.planned !== 0 || item.spent !== 0) && (
                                                <div className={`text-xs text-right ${isCompleted ? 'opacity-50' : 'opacity-70'}`}>
                                                    {unplannedSpending > 0
                                                        ? `Unplanned spending: ${unplannedSpending.toLocaleString(undefined, { maximumFractionDigits: 0 })}${totalLeft > 0 ? ` | Left: ${totalLeft.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : totalOverspent > 0 ? ` | Over: ${totalOverspent.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : ''}`
                                                        : item.planned === 0 && item.spent !== 0
                                                            ? `Unplanned spending: ${Math.abs(item.spent).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                                            : totalOverspent > 0
                                                                ? `Over: ${totalOverspent.toLocaleString(undefined, { maximumFractionDigits: 0 })}${totalLeft > 0 ? ` | Left: ${totalLeft.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : ''}`
                                                                : isOver
                                                                    ? `Over by ${Math.abs(plannedSpending - Math.abs(item.planned)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                                                    : `Left: ${totalLeft.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
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
