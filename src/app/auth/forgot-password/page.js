'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ForgotPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

            if (!res.ok) throw new Error('Failed to send code. Please try again or check your email.');

            // Redirect to reset page
            router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                        {loading ? <span className="loading loading-spinner"></span> : 'Send Verification Code'}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <Link href="/auth/signin" className="link link-primary text-sm">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
            <Suspense fallback={<div>Loading...</div>}>
                <ForgotPasswordContent />
            </Suspense>
        </div>
    );
}
