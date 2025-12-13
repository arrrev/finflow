"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createPortal } from 'react-dom';
import { useToaster } from '@/components/Toaster';

const PREDEFINED_ACCOUNTS = [
    { name: 'Card', color: '#4a86e8', currency: 'AMD' },
    { name: 'Cash', color: '#6aa84f', currency: 'AMD' },
    { name: 'Saving', color: '#f1c232', currency: 'AMD' },
    { name: 'Bank Account', color: '#674ea7', currency: 'USD' },
    { name: 'Credit Card', color: '#cc0000', currency: 'AMD' }
];

const PREDEFINED_CATEGORIES = [
    { name: 'Bill', color: '#cc0000' },
    { name: 'Food', color: '#e69138' },
    { name: 'Grocery', color: '#f6b26b' },
    { name: 'Transport', color: '#3d85c6' },
    { name: 'Entertainment', color: '#8e7cc3' },
    { name: 'Health', color: '#6aa84f' },
    { name: 'Shopping', color: '#e06666' },
    { name: 'Salary', color: '#38761d' },
    { name: 'Investment', color: '#134f5c' }
];

export default function OnboardingWizard() {
    const { data: session } = useSession();
    const { success, error } = useToaster();
    const [showWizard, setShowWizard] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);

    // Step 1: Accounts
    const [selectedAccounts, setSelectedAccounts] = useState([]);

    // Step 2: Categories
    const [selectedCategories, setSelectedCategories] = useState([]);

    // Check if user has no activity (only check once when session is available)
    useEffect(() => {
        if (!session?.user) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        const checkActivity = async () => {
            try {
                const res = await fetch('/api/user/activity-check', {
                    cache: 'no-store' // Ensure fresh data
                });
                if (!res.ok) {
                    if (isMounted) setLoading(false);
                    return;
                }
                
                const data = await res.json();
                
                if (!isMounted) return;
                
                // Show wizard only if user has NO transactions AND NO accounts AND NO categories
                // If user has at least one transaction OR category OR account, do not show the wizard
                const shouldShowWizard = data.hasNoActivity;
                
                // Also check localStorage as a backup (in case user skipped)
                // Works for both regular login and Google login users
                const userId = session.user.id || session.user.email; // Fallback to email if id not available
                const wizardCompleted = userId ? localStorage.getItem(`wizard_completed_${userId}`) : null;
                
                if (wizardCompleted === 'true') {
                    setShowWizard(false);
                } else {
                    setShowWizard(shouldShowWizard);
                }
                
                setLoading(false);
            } catch (err) {
                console.error('Error checking activity:', err);
                if (isMounted) setLoading(false);
            }
        };

        checkActivity();

        return () => {
            isMounted = false;
        };
    }, [session?.user?.id, session?.user?.email]); // Only depend on user identifiers, not entire session

    const handleAccountToggle = (account) => {
        setSelectedAccounts(prev => {
            const exists = prev.find(a => a.name === account.name);
            if (exists) {
                return prev.filter(a => a.name !== account.name);
            } else {
                return [...prev, account];
            }
        });
    };

    const handleCategoryToggle = (category) => {
        setSelectedCategories(prev => {
            const exists = prev.find(c => c.name === category.name);
            if (exists) {
                return prev.filter(c => c.name !== category.name);
            } else {
                return [...prev, category];
            }
        });
    };

    const handleCreateAccounts = async () => {
        if (selectedAccounts.length === 0) {
            error('Please select at least one account');
            return;
        }

        try {
            for (const account of selectedAccounts) {
                const res = await fetch('/api/accounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: account.name,
                        color: account.color,
                        default_currency: account.currency,
                        initial_balance: 0,
                        is_available: true
                    })
                });
                if (!res.ok) throw new Error('Failed to create account');
            }
            success('Accounts created successfully');
            setCurrentStep(2);
        } catch (err) {
            error('Error creating accounts');
        }
    };

    const handleCreateCategories = async () => {
        if (selectedCategories.length === 0) {
            error('Please select at least one category');
            return;
        }

        try {
            let order = 1;
            for (const category of selectedCategories) {
                const res = await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: category.name,
                        color: category.color,
                        default_account_id: null,
                        include_in_chart: true
                    })
                });
                if (!res.ok) throw new Error('Failed to create category');
                order++;
            }
            success('Categories created successfully');
            setCurrentStep(3);
        } catch (err) {
            error('Error creating categories');
        }
    };

    const handleFinish = () => {
        // Mark wizard as completed (works for both regular and Google login)
        const userId = session?.user?.id || session?.user?.email;
        if (userId) {
            localStorage.setItem(`wizard_completed_${userId}`, 'true');
        }
        setShowWizard(false);
        success('Welcome to FinFlow42! You can now start tracking your finances.');
        // Refresh the page to show updated data
        window.location.reload();
    };

    const handleSkip = () => {
        // Mark wizard as skipped/completed so it doesn't show again (works for both regular and Google login)
        const userId = session?.user?.id || session?.user?.email;
        if (userId) {
            localStorage.setItem(`wizard_completed_${userId}`, 'true');
        }
        setShowWizard(false);
    };

    if (loading || !showWizard || !session) return null;

    const wizardContent = (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <div className="modal-box max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold">Welcome to FinFlow42!</h3>
                    <button
                        onClick={handleSkip}
                        className="btn btn-sm btn-circle btn-ghost"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="steps mb-6">
                    <div className={`step ${currentStep >= 1 ? 'step-primary' : ''}`}>Accounts</div>
                    <div className={`step ${currentStep >= 2 ? 'step-primary' : ''}`}>Categories</div>
                    <div className={`step ${currentStep >= 3 ? 'step-primary' : ''}`}>Planning</div>
                </div>

                {/* Step 1: Accounts */}
                {currentStep === 1 && (
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-lg font-semibold mb-2">Step 1: Select Your Accounts</h4>
                            <p className="text-sm text-base-content/70 mb-4">
                                Select the accounts you want to use. You can manage multiple accounts in different currencies. Don't worry - you can modify, add new accounts, or manage them later in Settings.
                            </p>
                        </div>

                        {/* Predefined Accounts */}
                        <div className="mb-4">
                            <label className="label">
                                <span className="label-text font-medium">Predefined Accounts</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {PREDEFINED_ACCOUNTS.map((account) => (
                                    <label
                                        key={account.name}
                                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                            selectedAccounts.find(a => a.name === account.name)
                                                ? 'border-primary bg-primary/10'
                                                : 'border-base-300 hover:border-primary/50'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-primary"
                                            checked={!!selectedAccounts.find(a => a.name === account.name)}
                                            onChange={() => handleAccountToggle(account)}
                                        />
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: account.color }}
                                        />
                                        <span className="flex-1">{account.name}</span>
                                        <span className="text-xs text-base-content/60">{account.currency}</span>
                                    </label>
                                ))}
                            </div>
                        </div>


                        {selectedAccounts.length > 0 && (
                            <div className="alert alert-success">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <div className="font-semibold">{selectedAccounts.length} account{selectedAccounts.length > 1 ? 's' : ''} selected</div>
                                    <div className="text-sm opacity-80">
                                        {selectedAccounts.map((a, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1 mr-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }}></div>
                                                {a.name} ({a.currency})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={handleSkip} className="btn btn-ghost">
                                Skip Wizard
                            </button>
                            <button onClick={handleCreateAccounts} className="btn btn-primary">
                                Continue →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Categories */}
                {currentStep === 2 && (
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-lg font-semibold mb-2">Step 2: Select Your Categories</h4>
                            <p className="text-sm text-base-content/70 mb-4">
                                Select categories to organize your expenses and income. Don't worry - you can modify, add new categories, or manage them later in Settings.
                            </p>
                        </div>

                        {/* Predefined Categories */}
                        <div className="mb-4">
                            <label className="label">
                                <span className="label-text font-medium">Predefined Categories</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {PREDEFINED_CATEGORIES.map((category) => (
                                    <label
                                        key={category.name}
                                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                            selectedCategories.find(c => c.name === category.name)
                                                ? 'border-primary bg-primary/10'
                                                : 'border-base-300 hover:border-primary/50'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-primary"
                                            checked={!!selectedCategories.find(c => c.name === category.name)}
                                            onChange={() => handleCategoryToggle(category)}
                                        />
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: category.color }}
                                        />
                                        <span className="flex-1">{category.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>


                        {selectedCategories.length > 0 && (
                            <div className="alert alert-success">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <div className="font-semibold">{selectedCategories.length} categor{selectedCategories.length > 1 ? 'ies' : 'y'} selected</div>
                                    <div className="text-sm opacity-80">
                                        {selectedCategories.map((c, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1 mr-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }}></div>
                                                {c.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setCurrentStep(1)} className="btn btn-ghost">
                                ← Back
                            </button>
                            <button onClick={handleSkip} className="btn btn-ghost">
                                Skip Wizard
                            </button>
                            <button onClick={handleCreateCategories} className="btn btn-primary">
                                Continue →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Welcome */}
                {currentStep === 3 && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-success mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 className="text-2xl font-semibold mb-2">Welcome to FinFlow42!</h4>
                            <p className="text-base text-base-content/70 mb-6">
                                You're all set! Your accounts and categories have been created successfully.
                            </p>
                        </div>

                        <div className="card bg-base-200">
                            <div className="card-body">
                                <h5 className="font-semibold mb-3">What's Next?</h5>
                                <ul className="space-y-2 text-sm text-base-content/80">
                                    <li className="flex items-start gap-2">
                                        <span className="text-success mt-1">✓</span>
                                        <span>Start tracking your transactions on the dashboard</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-success mt-1">✓</span>
                                        <span>Manage your accounts - modify, add new, or delete in <strong>Settings → Accounts</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-success mt-1">✓</span>
                                        <span>Manage your categories - modify, add new, or delete in <strong>Settings → Categories</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-success mt-1">✓</span>
                                        <span>Set up your budget planning in the <strong>Planning</strong> page</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="alert alert-info">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Remember: You can always manage your accounts, categories, and plans later in Settings.</span>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setCurrentStep(2)} className="btn btn-ghost">
                                ← Back
                            </button>
                            <button onClick={handleFinish} className="btn btn-primary btn-lg">
                                Get Started
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(wizardContent, document.body);
}

