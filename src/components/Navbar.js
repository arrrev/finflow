"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
    const pathname = usePathname();
    const { data: session, update } = useSession();
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Fetch avatar from profile API
    useEffect(() => {
        if (session) {
            fetch('/api/profile')
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data?.image_url) {
                        setAvatarUrl(data.image_url);
                    }
                })
                .catch(() => { });
        }
    }, [session]);

    // Listen for custom event "profileUpdated" to refresh avatar
    useEffect(() => {
        const handleProfileUpdate = () => {
            update();
            // Refetch avatar
            fetch('/api/profile')
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data?.image_url) {
                        setAvatarUrl(data.image_url);
                    }
                })
                .catch(() => { });
        };
        window.addEventListener('profileUpdated', handleProfileUpdate);
        return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
    }, [update]);

    const handleSignOut = () => {
        signOut({ callbackUrl: '/auth/signin' });
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        const elem = document.activeElement;
        if (elem) {
            elem.blur();
        }
        // Close details (desktop settings menu)
        const details = document.querySelectorAll('details[open]');
        details.forEach(detail => {
            detail.removeAttribute('open');
        });
    };

    // Close drawer when clicking outside (Safari-compatible)
    useEffect(() => {
        if (!drawerOpen) return;
        
        const handleClickOutside = (e) => {
            const drawer = document.getElementById('mobile-drawer');
            const toggle = document.getElementById('drawer-toggle');
            if (drawer && toggle && !drawer.contains(e.target) && !toggle.contains(e.target)) {
                setDrawerOpen(false);
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setDrawerOpen(false);
            }
        };

        // Use both touch and mouse events for Safari compatibility
        // Safari needs touchstart for proper mobile interaction
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        
        // Prevent body scroll when drawer is open (Safari fix)
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        
        return () => {
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = originalOverflow;
        };
    }, [drawerOpen]);

    // Close drawer on route change
    useEffect(() => {
        setDrawerOpen(false);
    }, [pathname]);

    if (!session) return null;

    // Hide navbar if email is not verified (user should complete verification first)
    if (session.user?.emailVerified === false) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-base-200 pt-2 sm:pt-4">
            <div className="max-w-5xl mx-auto px-2 sm:px-4">
                <div className="navbar bg-base-100 shadow-sm mb-2 sm:mb-8 rounded-lg">
                    <div className="navbar-start">
                {/* Mobile Drawer Toggle */}
                <button
                    id="drawer-toggle"
                    onClick={() => setDrawerOpen(!drawerOpen)}
                    onTouchStart={(e) => {
                        // Ensure button works on first touch in Safari
                        e.stopPropagation();
                    }}
                    className="btn btn-ghost lg:hidden p-2 min-h-0 h-10 w-10"
                    aria-label="Open menu"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                
                {/* Mobile Drawer Backdrop */}
                {drawerOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] lg:hidden transition-opacity duration-300"
                        onClick={() => setDrawerOpen(false)}
                        onTouchStart={(e) => {
                            // Prevent drawer from opening when touching backdrop
                            e.stopPropagation();
                            setDrawerOpen(false);
                        }}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    />
                )}
                
                {/* Mobile Drawer */}
                <div
                    id="mobile-drawer"
                    className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-base-100 shadow-2xl z-[9999] lg:hidden transform transition-transform duration-300 ease-in-out overflow-y-auto ${
                        drawerOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                    style={{
                        WebkitTransform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
                        WebkitTransition: 'transform 300ms ease-in-out',
                        willChange: 'transform'
                    }}
                >
                            <div className="p-4 border-b border-base-300 flex items-center justify-between">
                                <Link 
                                    href="/" 
                                    className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                                    onClick={closeDrawer}
                                >
                                    FinFlow42
                                </Link>
                                <button
                                    onClick={() => setDrawerOpen(false)}
                                    onTouchStart={(e) => {
                                        e.stopPropagation();
                                        setDrawerOpen(false);
                                    }}
                                    className="btn btn-ghost btn-sm btn-circle"
                                    aria-label="Close menu"
                                    style={{ WebkitTapHighlightColor: 'transparent' }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <nav className="p-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                                <ul className="menu menu-vertical gap-2">
                                    <li>
                                        <Link 
                                            href="/" 
                                            className={`text-base py-3 px-4 rounded-lg ${pathname === '/' ? 'active bg-primary text-primary-content' : ''}`}
                                            onClick={closeDrawer}
                                            onTouchStart={(e) => {
                                                // Ensure link works on first touch in Safari
                                                e.stopPropagation();
                                            }}
                                        >
                                            Dashboard
                                        </Link>
                                    </li>
                                    <li>
                                        <Link 
                                            href="/transactions" 
                                            className={`text-base py-3 px-4 rounded-lg ${pathname === '/transactions' ? 'active bg-primary text-primary-content' : ''}`}
                                            onClick={closeDrawer}
                                            onTouchStart={(e) => {
                                                e.stopPropagation();
                                            }}
                                        >
                                            Transactions
                                        </Link>
                                    </li>
                                    <li>
                                        <Link 
                                            href="/planning" 
                                            className={`text-base py-3 px-4 rounded-lg ${pathname === '/planning' ? 'active bg-primary text-primary-content' : ''}`}
                                            onClick={closeDrawer}
                                            onTouchStart={(e) => {
                                                e.stopPropagation();
                                            }}
                                        >
                                            Planning
                                        </Link>
                                    </li>
                                    <li className="pt-2">
                                        <div className={`text-base py-3 px-4 rounded-lg font-semibold ${pathname.startsWith('/settings') ? 'text-primary' : ''}`}>
                                            Settings
                                        </div>
                                        <ul className="pl-4 mt-2 space-y-1">
                                            <li>
                                                <Link 
                                                    href="/settings/categories" 
                                                    className={`text-sm py-2.5 px-4 rounded-lg block ${pathname === '/settings/categories' ? 'active bg-primary/20 text-primary' : ''}`}
                                                    onClick={closeDrawer}
                                                    onTouchStart={(e) => {
                                                        e.stopPropagation();
                                                    }}
                                                >
                                                    Categories
                                                </Link>
                                            </li>
                                            <li>
                                                <Link 
                                                    href="/settings/accounts" 
                                                    className={`text-sm py-2.5 px-4 rounded-lg block ${pathname === '/settings/accounts' ? 'active bg-primary/20 text-primary' : ''}`}
                                                    onClick={closeDrawer}
                                                    onTouchStart={(e) => {
                                                        e.stopPropagation();
                                                    }}
                                                >
                                                    Accounts
                                                </Link>
                                            </li>
                                        </ul>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                
                <Link href="/" className="btn btn-ghost text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" onClick={closeDrawer}>
                    FinFlow42
                </Link>
            </div>

            <div className="navbar-center hidden lg:flex">
                    <ul className="menu menu-horizontal px-1 gap-2">
                    <li><Link href="/" className={pathname === '/' ? 'active' : ''} onClick={closeDrawer}>Dashboard</Link></li>
                    <li><Link href="/transactions" className={pathname === '/transactions' ? 'active' : ''} onClick={closeDrawer}>Transactions</Link></li>
                    <li><Link href="/planning" className={pathname === '/planning' ? 'active' : ''} onClick={closeDrawer}>Planning</Link></li>
                    <li>
                        <details>
                            <summary className={pathname.startsWith('/settings') ? 'active' : ''}>Settings</summary>
                            <ul className="p-2 z-[100] bg-base-100 rounded-box shadow-sm min-w-[150px]">
                                <li><Link href="/settings/categories" className={pathname === '/settings/categories' ? 'active' : ''} onClick={closeDrawer}>Categories</Link></li>
                                <li><Link href="/settings/accounts" className={pathname === '/settings/accounts' ? 'active' : ''} onClick={closeDrawer}>Accounts</Link></li>
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
                    <div tabIndex={0} role="button" className="avatar">
                        <div className="w-10 rounded-full ring ring-base-300 ring-offset-base-100 ring-offset-1">
                            {avatarUrl ? (
                                <img 
                                    src={avatarUrl} 
                                    alt={session.user.firstName || 'User'} 
                                />
                            ) : (
                                <div className="bg-neutral text-neutral-content w-full h-full rounded-full flex items-center justify-center">
                                    <span className="text-xs font-semibold">
                                        {session.user?.firstName ? session.user.firstName[0].toUpperCase() : session.user?.email?.[0].toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <ul tabIndex={0} className="mt-3 z-[100] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52 max-w-[90vw]">
                        <li className="menu-title md:hidden">
                            <span className="block truncate break-all text-xs" title={session.user?.email}>
                                {session.user?.email}
                            </span>
                        </li>
                        <li><Link href="/profile" onClick={closeDrawer}>Profile</Link></li>
                        <li><button onClick={handleSignOut}>Logout</button></li>
                    </ul>
                </div>
            </div>
                </div>
            </div>
        </div>
    );
}
