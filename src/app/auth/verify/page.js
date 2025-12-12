"use client";
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

            router.push('/?verified=true');
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
            alert('Code resent!');
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
        <div className="min-h-screen w-full flex items-center justify-center bg-[#fbfbfd]">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 via-purple-50/30 to-white pointer-events-none" />

            <div className="relative w-full max-w-[400px] px-6">
                <div className="text-center mb-10 space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                        Verify Email
                    </h1>
                    <p className="text-gray-500 text-base">
                        Code sent to <span className="font-medium text-gray-900">{email}</span>
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-500 text-sm rounded-xl text-center font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="000000"
                                className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-3xl tracking-[0.5em] text-center font-bold font-mono"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-medium shadow-lg shadow-gray-900/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <span className="loading loading-spinner loading-sm text-white/80"></span> : 'Verify Account'}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <button
                            onClick={handleResend}
                            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                            disabled={resendLoading}
                        >
                            {resendLoading ? 'Sending...' : "Didn't receive code? Resend"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#fbfbfd]" />}>
            <VerifyContent />
        </Suspense>
    );
}
