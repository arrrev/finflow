"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
    const pathname = usePathname();
    const { data: session, update } = useSession();

    // Listen for custom event "profileUpdated" to trigger session refresh
    React.useEffect(() => {
        const handleProfileUpdate = () => update();
        window.addEventListener('profileUpdated', handleProfileUpdate);
        return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
    }, [update]);

    const handleSignOut = () => {
        signOut({ callbackUrl: '/auth/signin' });
    };

    if (!session) return null;

    return (
        <div className="navbar bg-base-100 shadow-sm mb-8 rounded-box">
            <div className="navbar-start">
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
                    </div>
                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                        <li><Link href="/" className={pathname === '/' ? 'active' : ''}>Dashboard</Link></li>
                        <li><Link href="/transactions" className={pathname === '/transactions' ? 'active' : ''}>Transactions</Link></li>
                        <li><Link href="/planning" className={pathname === '/planning' ? 'active' : ''}>Planning</Link></li>
                        <li>
                            <a className={pathname.startsWith('/settings') ? 'active' : ''}>Settings</a>
                            <ul className="p-2">
                                <li><Link href="/settings/categories" className={pathname === '/settings/categories' ? 'active' : ''}>Categories</Link></li>
                                <li><Link href="/settings/accounts" className={pathname === '/settings/accounts' ? 'active' : ''}>Accounts</Link></li>
                            </ul>
                        </li>
                    </ul>
                </div>
                <Link href="/" className="btn btn-ghost text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    FinFlow
                </Link>
            </div>

            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    <li><Link href="/" className={pathname === '/' ? 'active' : ''}>Dashboard</Link></li>
                    <li><Link href="/transactions" className={pathname === '/transactions' ? 'active' : ''}>Transactions</Link></li>
                    <li><Link href="/planning" className={pathname === '/planning' ? 'active' : ''}>Planning</Link></li>
                    <li>
                        <details>
                            <summary className={pathname.startsWith('/settings') ? 'active' : ''}>Settings</summary>
                            <ul className="p-2 z-[1] bg-base-100 rounded-box shadow-sm min-w-[150px]">
                                <li><Link href="/settings/categories" className={pathname === '/settings/categories' ? 'active' : ''}>Categories</Link></li>
                                <li><Link href="/settings/accounts" className={pathname === '/settings/accounts' ? 'active' : ''}>Accounts</Link></li>
                            </ul>
                        </details>
                    </li>
                </ul>
            </div>

            <div className="navbar-end">
                <div className="hidden md:block text-right mr-3">
                    <div className="text-sm font-bold text-base-content leading-tight">
                        {session.user?.firstName} {session.user?.lastName}
                    </div>
                </div>
                <ThemeToggle />
                <div className="dropdown dropdown-end ml-2">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
                        {session.user?.image ? (
                            <div className="w-10 rounded-full">
                                <img src={session.user.image} alt={session.user.firstName || 'User'} />
                            </div>
                        ) : (
                            <div className="bg-neutral text-neutral-content rounded-full w-10">
                                <span className="text-xs">
                                    {session.user?.firstName ? session.user.firstName[0].toUpperCase() : session.user?.email?.[0].toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                    <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                        <li className="menu-title md:hidden">
                            {session.user?.email}
                        </li>
                        <li><Link href="/profile">Profile</Link></li>
                        <li><button onClick={handleSignOut}>Logout</button></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
