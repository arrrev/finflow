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
        return <div className="p-10 text-center text-white">Invalid request</div>;
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0a0f]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />

            <div className="relative w-full max-w-md px-6 z-10">
                <div className="text-center mb-10 space-y-3">
                    <h1 className="text-5xl font-black tracking-tight text-white">
                        Verify Email
                    </h1>
                    <p className="text-gray-500 text-sm font-medium tracking-wide">
                        Code sent to <span className="text-white">{email}</span>
                    </p>
                </div>

                <div className="relative bg-[#13131a] backdrop-blur-xl p-8 rounded-2xl border border-white/5 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleVerify} className="space-y-6">
                        <input
                            type="text"
                            placeholder="000000"
                            className="w-full px-5 py-5 bg-[#1a1a24] border border-white/10 rounded-2xl text-white placeholder:text-gray-700 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200 text-4xl tracking-[0.5em] text-center font-mono font-bold"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <span className="loading loading-spinner loading-sm text-black"></span> : 'Verify Account'}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <button
                            onClick={handleResend}
                            className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
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
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
            <VerifyContent />
        </Suspense>
    );
}
