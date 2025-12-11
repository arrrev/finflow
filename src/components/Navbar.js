"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

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
            <div className="flex-1">
                <Link href="/" className="btn btn-ghost text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    FinFlow
                </Link>
            </div>
            <div className="flex-none gap-2">
                <div className="hidden md:block text-right mr-2">
                    <div className="text-sm font-bold text-base-content">
                        {session.user?.firstName} {session.user?.lastName}
                    </div>
                    <div className="text-xs text-base-content/70">{session.user?.email}</div>
                </div>
                <ul className="menu menu-horizontal px-1">
                    <li>
                        <Link href="/" className={pathname === '/' ? 'active' : ''}>Dashboard</Link>
                    </li>
                    <li>
                        <Link href="/settings/categories" className={pathname === '/settings/categories' ? 'active' : ''}>Categories</Link>
                    </li>
                    <li>
                        <Link href="/settings/accounts" className={pathname === '/settings/accounts' ? 'active' : ''}>Accounts</Link>
                    </li>
                    <li>
                        <Link href="/planning" className={pathname === '/planning' ? 'active' : ''}>Planning</Link>
                    </li>
                    <li>
                        <Link href="/transactions" className={pathname === '/transactions' ? 'active' : ''}>Transactions</Link>
                    </li>
                </ul>
                <div className="dropdown dropdown-end">
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
                        {/* User Info Section */}
                        <li className="menu-title">
                            <div className="flex flex-col items-center py-4 gap-2">
                                <div className="bg-neutral text-neutral-content rounded-full w-12 h-12 flex items-center justify-center">
                                    <span className="text-xl font-bold">
                                        {session.user?.firstName ? session.user.firstName[0].toUpperCase() : session.user?.email?.[0].toUpperCase()}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm font-bold text-base-content">
                                        {session.user?.firstName} {session.user?.lastName}
                                    </div>
                                    <div className="text-xs text-base-content/70">{session.user?.email}</div>
                                </div>
                            </div>
                        </li>
                        <div className="divider my-0"></div>
                        <li><Link href="/profile">Profile</Link></li>
                        <li><button onClick={handleSignOut}>Logout</button></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
