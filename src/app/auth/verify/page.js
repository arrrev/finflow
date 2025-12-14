'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, update, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useToaster } from '@/components/Toaster';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const type = searchParams.get('type') || 'REGISTER'; // Default to REGISTER for backward compatibility
    const { success } = useToaster();

    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [isAutoSent, setIsAutoSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    
    // Use ref to track if auto-send has been triggered to prevent multiple sends
    const autoSendTriggeredRef = useRef(false);
    const isSendingRef = useRef(false);

    const handleResend = useCallback(async (isAuto = false) => {
        // Prevent concurrent sends or if countdown is active
        if (isSendingRef.current || countdown > 0) {
            return;
        }
        
        isSendingRef.current = true;
        setResendLoading(true);
        setError('');
        setIsAutoSent(isAuto);
        try {
            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    type: type === 'LOGIN' ? 'LOGIN' : 'REGISTER',
                    action: 'send'
                })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                // If rate limited, start countdown
                if (res.status === 429 && data.remainingSeconds) {
                    setCountdown(data.remainingSeconds);
                } else {
                    throw new Error(data.error || 'Failed to resend code');
                }
                return;
            }
            
            setOtpSent(true);
            setCountdown(30); // Start 30 second countdown after successful send
            // Mark as sent in sessionStorage
            if (typeof window !== 'undefined') {
                const otpSentKey = `otp_sent_${email}_${type}`;
                sessionStorage.setItem(otpSentKey, 'true');
            }
            if (!isAuto) { // Only show toast if manually triggered, not auto-sent
                success('Code resent to your email');
            }
        } catch (err) {
            setError(err.message || 'Failed to resend code. Please try again.');
        } finally {
            setResendLoading(false);
            isSendingRef.current = false;
        }
    }, [email, type, countdown, success]);

    // Countdown timer effect
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Auto-send OTP on mount for LOGIN type - only once per session
    useEffect(() => {
        // Check if OTP was already sent in this session (stored in sessionStorage)
        const otpSentKey = `otp_sent_${email}_${type}`;
        const wasOtpSent = typeof window !== 'undefined' && sessionStorage.getItem(otpSentKey) === 'true';
        
        // Only auto-send if LOGIN type, email exists, hasn't been sent yet, and hasn't been triggered
        if (type === 'LOGIN' && email && !otpSent && !autoSendTriggeredRef.current && !wasOtpSent) {
            autoSendTriggeredRef.current = true;
            // Mark as sent in sessionStorage before sending
            if (typeof window !== 'undefined') {
                sessionStorage.setItem(otpSentKey, 'true');
            }
            handleResend(true);
        } else if (wasOtpSent) {
            // If OTP was already sent, mark as sent in state and start countdown
            setOtpSent(true);
            setCountdown(30); // Start countdown if OTP was already sent
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - only run once on mount

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
                    type: type === 'LOGIN' ? 'LOGIN' : 'REGISTER',
                    action: 'verify',
                    code
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Verification failed');

            // If LOGIN type, refresh the session to update email_verified status
            if (type === 'LOGIN') {
                // Update session to reflect email_verified = true
                await update({ emailVerified: true });
                // Small delay to ensure session is updated
                await new Promise(resolve => setTimeout(resolve, 500));
                // Redirect to dashboard or callback URL
                const callbackUrl = searchParams.get('callbackUrl') || '/';
                router.replace(callbackUrl);
                return;
            }

            // For REGISTER type, handle auto-login if password is stored
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

            // Keep loading state active and navigate - loading will persist until new page loads
            router.replace('/');
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };


    if (!email) {
        return <div className="p-10 text-center">Invalid request</div>;
    }

    // Show full loading screen when loading
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="text-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="mt-4 text-base-content/70">Verifying and logging you in...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title justify-center text-2xl mb-2">Verify Email</h2>
                <p className="text-center text-sm text-gray-500 mb-6">
                    Enter the code sent to <strong>{email}</strong>
                </p>
                
                <div className="flex justify-center gap-4 mb-4">
                    <button
                        onClick={async () => {
                            await signOut({ callbackUrl: '/auth/signin' });
                        }}
                        className="link link-primary text-sm"
                    >
                        Sign Out
                    </button>
                    <span className="text-base-content/50">|</span>
                    <Link href="/auth/signin" className="link link-primary text-sm">
                        Back to Sign In
                    </Link>
                </div>

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
                    onClick={() => handleResend(false)}
                    className="btn btn-outline w-full mt-4"
                    disabled={resendLoading || countdown > 0}
                >
                    {resendLoading ? (
                        <span className="loading loading-spinner"></span>
                    ) : countdown > 0 ? (
                        `Resend Code (${countdown}s)`
                    ) : (
                        'Resend Code'
                    )}
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
