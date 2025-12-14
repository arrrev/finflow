'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

function ForgotPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const otpSentRef = useRef(false);

    // Auto-send OTP for authenticated users (only once)
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.email && !otpSentRef.current) {
            const userEmail = session.user.email;
            setEmail(userEmail);
            otpSentRef.current = true;

            // Auto-send OTP
            const sendOTP = async () => {
                setLoading(true);
                setError('');

                try {
                    const res = await fetch('/api/auth/otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: userEmail,
                            type: 'RESET',
                            action: 'send'
                        })
                    });

                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || 'Failed to send code.');
                    }

                    router.push(`/auth/reset-password?email=${encodeURIComponent(userEmail)}`);
                } catch (err) {
                    setError(err.message);
                    otpSentRef.current = false; // Allow retry on error
                } finally {
                    setLoading(false);
                }
            };

            sendOTP();
        }
    }, [status, session?.user?.email, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    type: 'RESET',
                    action: 'send'
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to send code. Please try again or check your email.');
            }

            router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Show loading for authenticated users while auto-sending
    if (status === 'authenticated') {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Logo/Brand */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-base-content mb-2">
                            FinFlow
                        </h1>
                        <p className="text-base-content/60">
                            Sending Verification Code
                        </p>
                    </div>

                    <div className="card bg-base-100 shadow-lg border border-base-300">
                        <div className="card-body p-4 sm:p-6 md:p-8">
                            <div className="text-center space-y-4">
                                <p className="text-base-content/70">
                                    Sending code to <span className="font-semibold">{session?.user?.email}</span>
                                </p>
                                {loading && (
                                    <span className="loading loading-spinner loading-lg text-primary"></span>
                                )}
                                {error && (
                                    <div className="alert alert-error">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>
                            
                            {error && (
                                <div className="mt-6 flex flex-col gap-3">
                                    <Link href="/auth/forgot-password" className="btn btn-primary w-full">
                                        Try Again
                                    </Link>
                                    <Link href="/auth/signin" className="btn btn-outline w-full">
                                        Back to Sign In
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
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
                        Forgot Password
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
                                    <span className="label-text font-medium">Email</span>
                                </label>
                                <input
                                    type="email"
                                    className="input input-bordered w-full"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full btn-auth-submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Sending Code...
                                    </span>
                                ) : (
                                    'Send Verification Code'
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

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-base-200"><div>Loading...</div></div>}>
            <ForgotPasswordContent />
        </Suspense>
    );
}
