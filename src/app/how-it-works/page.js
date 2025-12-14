"use client";
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function HowItWorksPage() {
    const { data: session } = useSession();

    return (
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-8 py-4 md:py-8 px-2 sm:px-4">
            {!session && (
                <div className="mb-4">
                    <Link href="/auth/signin" className="btn btn-ghost btn-sm gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Login
                    </Link>
                </div>
            )}
            <div className="text-center mb-4 md:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    How FinFlow42 Works
                </h1>
                <p className="text-base md:text-lg text-base-content/70">
                    Your comprehensive guide to managing your finances with FinFlow42
                </p>
            </div>

            {/* Overview */}
            <section className="card bg-base-100 shadow-xl">
                <div className="card-body p-4 md:p-6">
                    <h2 className="card-title text-xl md:text-2xl mb-3 md:mb-4">Overview</h2>
                    <p className="text-base-content/80 leading-relaxed">
                        FinFlow42 is a powerful personal finance tracker designed to help you take control of your money. 
                        It allows you to track expenses, manage income, plan budgets, and analyze your spending patterns 
                        across multiple currencies and accounts.
                    </p>
                </div>
            </section>

            {/* Core Features */}
            <section className="card bg-base-100 shadow-xl">
                <div className="card-body p-4 md:p-6">
                    <h2 className="card-title text-xl md:text-2xl mb-3 md:mb-4">Core Features</h2>
                    
                    <div className="space-y-6">
                        {/* Transaction Management */}
                        <div className="border-l-4 border-primary pl-3 md:pl-4">
                            <h3 className="text-lg md:text-xl font-bold mb-2">Transaction Management</h3>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80">
                                <li><strong>Add Transactions:</strong> Quickly record expenses and income with our intuitive form</li>
                                <li><strong>Mathematical Expressions:</strong> Use expressions like <code className="bg-base-200 px-1 rounded">10000-3000+9000</code> in the amount field for quick calculations</li>
                                <li><strong>Categories & Subcategories:</strong> Organize transactions with custom categories and subcategories</li>
                                <li><strong>Multiple Accounts:</strong> Track transactions across different accounts (Cash, Bank, Credit Card, etc.)</li>
                                <li><strong>Notes:</strong> Add detailed notes to each transaction for better tracking</li>
                                <li><strong>Date Selection:</strong> Record transactions with custom dates for accurate historical tracking</li>
                                <li><strong>Bulk Operations:</strong> Select and delete multiple transactions at once</li>
                                <li><strong>Import/Export:</strong> Import transactions from CSV files or export your data for backup</li>
                            </ul>
                        </div>

                        {/* Multi-Currency Support */}
                        <div className="border-l-4 border-secondary pl-3 md:pl-4">
                            <h3 className="text-lg md:text-xl font-bold mb-2">Multi-Currency Support</h3>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80">
                                <li><strong>Supported Currencies:</strong> AMD (Armenian Dram), USD (US Dollar), EUR (Euro)</li>
                                <li><strong>Automatic Conversion:</strong> USD and EUR transactions are automatically converted to AMD using real-time exchange rates</li>
                                <li><strong>Original Values Preserved:</strong> The original amount and currency are stored for reference</li>
                                <li><strong>Account-Specific Currency:</strong> Each account can have its default currency</li>
                            </ul>
                        </div>

                        {/* Budget Planning */}
                        <div className="border-l-4 border-accent pl-3 md:pl-4">
                            <h3 className="text-lg md:text-xl font-bold mb-2">Budget Planning</h3>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80">
                                <li><strong>Monthly Plans:</strong> Set spending limits for categories and subcategories each month</li>
                                <li><strong>Reminder Dates:</strong> Set reminder dates to track when you should review your budget</li>
                                <li><strong>Upcoming Reminders:</strong> Dashboard shows incomplete plans with remaining amounts</li>
                                <li><strong>Progress Tracking:</strong> See how much you've spent vs. your planned budget</li>
                                <li><strong>Visual Indicators:</strong> Color-coded categories help you quickly identify spending areas</li>
                            </ul>
                        </div>

                        {/* Financial Analytics */}
                        <div className="border-l-4 border-success pl-3 md:pl-4">
                            <h3 className="text-lg md:text-xl font-bold mb-2">Financial Analytics</h3>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80">
                                <li><strong>Account Balances:</strong> View real-time balances for all your accounts</li>
                                <li><strong>Expense Distribution:</strong> Pie charts show how your spending is distributed across categories</li>
                                <li><strong>Time Period Analysis:</strong> Analyze spending by month, year, or custom date ranges</li>
                                <li><strong>Transfer Management:</strong> Transfer money between accounts with automatic currency conversion</li>
                                <li><strong>Visual Reports:</strong> Interactive charts help you understand your financial patterns</li>
                            </ul>
                        </div>

                        {/* Transaction History */}
                        <div className="border-l-4 border-warning pl-3 md:pl-4">
                            <h3 className="text-lg md:text-xl font-bold mb-2">Transaction History</h3>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80">
                                <li><strong>Advanced Filtering:</strong> Filter by date range, category, subcategory, or account</li>
                                <li><strong>Sorting:</strong> Sort transactions by date, amount, category, or account</li>
                                <li><strong>Pagination:</strong> View transactions in manageable chunks (20, 100, 500, 1000, or all)</li>
                                <li><strong>Search & Edit:</strong> Find and edit any transaction quickly</li>
                                <li><strong>Total Calculation:</strong> See the total sum of filtered transactions</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works - Step by Step */}
            <section className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title text-2xl mb-4">Getting Started</h2>
                    
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
                                1
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Create Your Account</h3>
                                <p className="text-base-content/80">
                                    Sign up with your email or use Google authentication. Your account is secure and your data is private.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-content flex items-center justify-center font-bold">
                                2
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Set Up Your Accounts</h3>
                                <p className="text-base-content/80">
                                    Go to Settings → Accounts and create accounts for your cash, bank accounts, credit cards, etc. 
                                    Each account can have its own default currency.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-accent-content flex items-center justify-center font-bold">
                                3
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Create Categories</h3>
                                <p className="text-base-content/80">
                                    Organize your spending by creating categories (Food, Transport, Entertainment, etc.) and 
                                    optionally add subcategories for more detailed tracking.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success text-success-content flex items-center justify-center font-bold">
                                4
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Start Recording Transactions</h3>
                                <p className="text-base-content/80">
                                    Use the transaction form on the dashboard to record your expenses and income. 
                                    You can use mathematical expressions in the amount field for quick calculations.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-warning text-warning-content flex items-center justify-center font-bold">
                                5
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Set Up Budget Plans</h3>
                                <p className="text-base-content/80">
                                    Go to Planning to set monthly spending limits for your categories. 
                                    Set reminder dates to track when you should review your budget.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-info text-info-content flex items-center justify-center font-bold">
                                6
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Analyze Your Finances</h3>
                                <p className="text-base-content/80">
                                    View your spending patterns, account balances, and financial analytics on the dashboard. 
                                    Use the Analytics section to see detailed breakdowns and charts.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tips & Best Practices */}
            <section className="card bg-base-100 shadow-xl">
                <div className="card-body p-4 md:p-6">
                    <h2 className="card-title text-xl md:text-2xl mb-3 md:mb-4">Tips & Best Practices</h2>
                    
                    <div className="space-y-3 text-base-content/80">
                        <div className="flex items-start gap-2">
                            <span className="text-success text-xl">✓</span>
                            <p><strong>Record transactions regularly:</strong> The more consistent you are, the better insights you'll get.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-success text-xl">✓</span>
                            <p><strong>Use subcategories:</strong> They help you understand exactly where your money goes.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-success text-xl">✓</span>
                            <p><strong>Set realistic budgets:</strong> Review your past spending before setting budget limits.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-success text-xl">✓</span>
                            <p><strong>Use notes:</strong> Add context to transactions so you remember what they were for later.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-success text-xl">✓</span>
                            <p><strong>Export regularly:</strong> Export your data periodically as a backup.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-success text-xl">✓</span>
                            <p><strong>Review reminders:</strong> Check your upcoming reminders to stay on track with your budget.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Technical Details */}
            <section className="card bg-base-100 shadow-xl">
                <div className="card-body p-4 md:p-6">
                    <h2 className="card-title text-xl md:text-2xl mb-3 md:mb-4">Technical Details</h2>
                    
                    <div className="space-y-4 text-base-content/80">
                        <div>
                            <h3 className="font-bold text-lg mb-2">Data Storage</h3>
                            <p>All your financial data is stored securely in a PostgreSQL database. Your data is encrypted and only accessible to you.</p>
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-lg mb-2">Currency Conversion</h3>
                            <p>USD and EUR transactions are automatically converted to AMD using real-time exchange rates. The original amount and currency are preserved for your records.</p>
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-lg mb-2">Session Management</h3>
                            <p>You can choose to "Remember Me" when logging in. With this option, your session lasts 30 days. Without it, sessions last 2 hours. Sessions automatically extend when you're active.</p>
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-lg mb-2">CSV Import/Export Format</h3>
                            <p>The CSV format uses these columns: <code className="bg-base-200 px-1 rounded">date, amount, currency, category, subcategory, account, note</code>. 
                            Date format is DD-Mon-YYYY (e.g., 10-Dec-2025).</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <div className="text-center py-4 md:py-8">
                {!session ? (
                    <div className="space-y-4">
                        <p className="text-base md:text-lg text-base-content/70">Ready to take control of your finances?</p>
                        <div className="flex justify-center items-center">
                            <Link href="/register" className="btn btn-primary btn-lg w-full sm:w-auto min-w-[140px]">
                                Get Started
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-base md:text-lg text-base-content/70">Need help? Check out the features above or explore the app!</p>
                        <Link href="/" className="btn btn-primary btn-lg w-full sm:w-auto">
                            Go to Dashboard
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

