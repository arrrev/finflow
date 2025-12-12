"use client";
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

            setSuccess('Password updated!');
            setTimeout(() => router.push('/auth/signin'), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!email) {
        return <div className="p-10 text-center">Invalid request</div>;
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#fbfbfd]">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 via-purple-50/30 to-white pointer-events-none" />

            <div className="relative w-full max-w-[400px] px-6">
                <div className="text-center mb-10 space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                        Reset Password
                    </h1>
                    <p className="text-gray-500 text-base">
                        Set a new password for your account
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-500 text-sm rounded-xl text-center font-medium">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 p-3 bg-green-50 text-green-600 text-sm rounded-xl text-center font-medium">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-[15px] tracking-widest text-center font-bold"
                                maxLength={6}
                                placeholder="000000"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                            />
                            <p className="text-[11px] text-gray-400 text-center font-medium uppercase tracking-wide">Verification Code</p>
                        </div>

                        <div className="space-y-1">
                            <input
                                type="password"
                                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-[15px]"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={8}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-medium shadow-lg shadow-gray-900/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <span className="loading loading-spinner loading-sm text-white/80"></span> : 'Reset Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#fbfbfd]" />}>
            <ResetPasswordContent />
        </Suspense>
    );
}
