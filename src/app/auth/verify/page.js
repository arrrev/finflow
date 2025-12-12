'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    type: 'REGISTER',
                    action: 'verify',
                    code
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Verification failed');

            // Get stored password for auto-login
            const storedPassword = sessionStorage.getItem('pendingLoginPassword');

            if (storedPassword) {
                // Auto-login the user after successful verification
                sessionStorage.removeItem('pendingLoginPassword'); // Clean up
                await signIn('credentials', {
                    email,
                    password: storedPassword,
                    redirect: false
                });
            }

            router.push('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    type: 'REGISTER',
                    action: 'send'
                })
            });
            if (!res.ok) throw new Error('Failed to resend code');
            alert('Code resent to your email');
        } catch (err) {
            setError(err.message);
        } finally {
            setResendLoading(false);
        }
    };

    if (!email) {
        return <div className="p-10 text-center">Invalid request</div>;
    }

    return (
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title justify-center text-2xl mb-2">Verify Email</h2>
                <p className="text-center text-sm text-gray-500 mb-6">
                    Enter the code sent to <strong>{email}</strong>
                </p>

                {error && <div className="alert alert-error mb-4 text-sm py-2">{error}</div>}

                <form onSubmit={handleVerify} className="flex flex-col gap-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Verification Code</span>
                        </label>
                        <input
                            type="text"
                            name="otp-code"
                            className="input input-bordered tracking-widest text-center text-2xl font-bold"
                            maxLength={6}
                            placeholder="000000"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            autoComplete="one-time-code"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            required
                        />
                        <div className="label">
                            <span className="label-text-alt text-gray-500">Check your email for the 6-digit code</span>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={loading}
                    >
                        {loading ? <span className="loading loading-spinner"></span> : 'Verify'}
                    </button>
                </form>

                <button
                    onClick={handleResend}
                    className="btn btn-ghost btn-xs mt-4"
                    disabled={resendLoading}
                >
                    {resendLoading ? 'Sending...' : 'Resend Code'}
                </button>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
            <Suspense fallback={<div>Loading...</div>}>
                <VerifyContent />
            </Suspense>
        </div>
    );
}
