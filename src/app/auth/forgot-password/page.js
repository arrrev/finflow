"use client";
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

function ForgotPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { status } = useSession();
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

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0a0f]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />

            <div className="relative w-full max-w-md px-6 z-10">
                <div className="text-center mb-10 space-y-3">
                    <h1 className="text-5xl font-black tracking-tight text-white">
                        Forgot Password
                    </h1>
                    <p className="text-gray-500 text-sm font-medium tracking-wide">
                        We'll send you a verification code
                    </p>
                </div>

                <div className="relative bg-[#13131a] backdrop-blur-xl p-8 rounded-2xl border border-white/5 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <input
                            type="email"
                            className="w-full px-5 py-3.5 bg-[#1a1a24] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <span className="loading loading-spinner loading-sm text-black"></span> : 'Send Code'}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <Link href={status === 'authenticated' ? "/" : "/auth/signin"} className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
                            {status === 'authenticated' ? 'Back to Dashboard' : 'Back to Sign In'}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
            <ForgotPasswordContent />
        </Suspense>
    );
}
