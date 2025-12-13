'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

function ForgotPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Auto-send OTP for authenticated users
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.email && !loading && !error) {
            const userEmail = session.user.email;
            setEmail(userEmail);

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
                } finally {
                    setLoading(false);
                }
            };

            sendOTP();
        }
    }, [status, session, router, loading, error]);

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
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="card w-full max-w-md bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title justify-center text-2xl mb-4">Sending Verification Code</h2>
                        <div className="text-center space-y-4">
                            <p className="text-base-content/70">
                                Sending code to <span className="font-semibold">{session?.user?.email}</span>
                            </p>
                            {loading && (
                                <span className="loading loading-spinner loading-lg text-primary"></span>
                            )}
                            {error && (
                                <div className="alert alert-error text-sm">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title justify-center text-2xl mb-4">Forgot Password</h2>

                    {error && <div className="alert alert-error mb-4 text-sm">{error}</div>}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Email</span>
                            </label>
                            <input
                                type="email"
                                className="input input-bordered"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                            {loading ? <span className="loading loading-spinner"></span> : 'Send Verification Code'}
                        </button>
                    </form>
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
