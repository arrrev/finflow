'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

            setSuccess('Password updated successfully! Redirecting to login...');
            setTimeout(() => router.push('/auth/signin'), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!email) {
        return <div className="p-10 text-center">Invalid request (missing email)</div>;
    }

    return (
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title justify-center text-2xl mb-4">Reset Password</h2>

                {error && <div className="alert alert-error mb-4 text-sm">{error}</div>}
                {success && <div className="alert alert-success mb-4 text-sm">{success}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Verification Code</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered tracking-widest"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                        />
                        <div className="label">
                            <span className="label-text-alt text-gray-500">Check your email for the code</span>
                        </div>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">New Password</span>
                        </label>
                        <input
                            type="password"
                            className="input input-bordered"
                            placeholder="Min 8 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            minLength={8}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                        {loading ? <span className="loading loading-spinner"></span> : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
            <Suspense fallback={<div>Loading...</div>}>
                <ResetPasswordContent />
            </Suspense>
        </div>
    );
}
