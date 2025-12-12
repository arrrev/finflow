'use client';

import { useState, Suspense } from 'react';
import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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

            // Redirect to reset page
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
            <div className="min-h-screen w-full flex items-center justify-center bg-[#fbfbfd]">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 via-purple-50/30 to-white pointer-events-none" />
                <div className="relative w-full max-w-[400px] px-6">
                    <div className="text-center space-y-4">
                        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                            Sending Verification Code
                        </h1>
                        <p className="text-gray-500 text-base">
                            Sending code to {session?.user?.email}...
                        </p>
                        {loading && (
                            <span className="loading loading-spinner loading-lg text-blue-600"></span>
                        )}
                        {error && (
                            <div className="p-4 bg-red-50 text-red-500 text-sm rounded-xl font-medium">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
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
        <div className="min-h-screen flex items-center justify-center bg-base-200">
                            <Suspense fallback={<div>Loading...</div>}>
                                <ForgotPasswordContent />
                            </Suspense>
                        </div>
                        );
}
