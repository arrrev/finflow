'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const email = searchParams.get('email');

    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    code,
                    newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to reset password');

            // Auto-login the user
            await signIn('credentials', {
                email,
                password: newPassword,
                redirect: false
            });

            // Keep loading state active and navigate - loading will persist until new page loads
            router.replace('/');
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (!email) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Logo/Brand */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-base-content mb-2">
                            FinFlow
                        </h1>
                        <p className="text-base-content/60">
                            Invalid Request
                        </p>
                    </div>

                    {/* Error Card */}
                    <div className="card bg-base-100 shadow-lg border border-base-300">
                        <div className="card-body p-4 sm:p-6 md:p-8 text-center">
                            <div className="alert alert-error mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Invalid request (missing email)</span>
                            </div>
                            
                            <p className="text-base-content/70 mb-6">
                                Please use the password reset link from your email or start the password reset process.
                            </p>

                            <div className="flex flex-col gap-3">
                                <Link href="/auth/forgot-password" className="btn btn-primary w-full">
                                    Forgot Password
                                </Link>
                                <Link href="/auth/signin" className="btn btn-outline w-full">
                                    Sign In
                                </Link>
                                <Link href="/" className="btn btn-ghost w-full">
                                    Back to Home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show full loading screen when loading
    if (loading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
                <div className="text-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="mt-4 text-base-content/70">Resetting password and logging you in...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-base-content mb-2">
                        FinFlow
                    </h1>
                    <p className="text-base-content/60">
                        Reset your password
                    </p>
                </div>

                {/* Form Card */}
                <div className="card bg-base-100 shadow-lg border border-base-300">
                    <div className="card-body p-4 sm:p-6 md:p-8">
                        {error && (
                            <div className="alert alert-error mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Verification Code</span>
                                </label>
                                <input
                                    type="text"
                                    name="otp-code"
                                    className="input input-bordered w-full text-center tracking-widest font-bold"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    autoComplete="one-time-code"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">New Password</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="input input-bordered w-full pr-10"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        minLength={8}
                                        autoComplete="new-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <label className="label">
                                    <span className="label-text-alt">Minimum 8 characters</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full btn-auth-submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Resetting Password...
                                    </span>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </form>

                        {/* Show back option only for non-authenticated users */}
                        {status !== 'authenticated' && (
                            <>
                                <div className="divider my-4">OR</div>
                                <Link href="/auth/signin" className="btn btn-outline w-full">
                                    Back to Sign In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-base-200 flex items-center justify-center"><div>Loading...</div></div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
