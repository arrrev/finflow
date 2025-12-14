"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';
import { useToaster } from './Toaster';

export default function ChangePasswordModal({ isOpen, onClose, onSuccess }) {
    const { data: session } = useSession();
    const { success, error: toastError } = useToaster();
    const [code, setCode] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [sendingOTP, setSendingOTP] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [useOTP, setUseOTP] = useState(true); // Toggle between OTP and current password

    // Auto-send OTP when modal opens (only if using OTP method)
    useEffect(() => {
        if (isOpen && session?.user?.email && !otpSent && useOTP) {
            sendOTP();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, useOTP]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setCode('');
            setCurrentPassword('');
            setNewPassword('');
            setError('');
            setOtpSent(false);
            setShowPassword(false);
            setShowCurrentPassword(false);
            setUseOTP(true);
        }
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const sendOTP = async () => {
        if (!session?.user?.email) return;
        
        setSendingOTP(true);
        setError('');

        try {
            const res = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: session.user.email,
                    type: 'RESET',
                    action: 'send'
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to send code');

            setOtpSent(true);
            success('Verification code sent to your email');
        } catch (err) {
            setError(err.message);
            toastError(err.message);
        } finally {
            setSendingOTP(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!newPassword) {
            setError('Please enter new password');
            setLoading(false);
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            setLoading(false);
            return;
        }

        if (useOTP && !code) {
            setError('Please enter verification code');
            setLoading(false);
            return;
        }

        if (!useOTP && !currentPassword) {
            setError('Please enter current password');
            setLoading(false);
            return;
        }

        try {
            // Update password with either OTP or current password
            const res = await fetch('/api/profile/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newPass: newPassword,
                    ...(useOTP ? { otpCode: code } : { current: currentPassword })
                })
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Failed to update password');
            }

            success('Password updated successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
            toastError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const modalContent = (
        <div className="modal modal-open" onClick={handleBackdropClick}>
            <div className="modal-box w-11/12 max-w-md" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-4">Change Password</h3>

                {error && (
                    <div className="alert alert-error mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Method Toggle */}
                <div className="mb-4">
                    <div className="tabs tabs-boxed w-full">
                        <button
                            type="button"
                            className={`tab flex-1 ${useOTP ? 'tab-active' : ''}`}
                            onClick={() => {
                                setUseOTP(true);
                                setCode('');
                                setCurrentPassword('');
                                setError('');
                                if (!otpSent) {
                                    sendOTP();
                                }
                            }}
                        >
                            Email Code
                        </button>
                        <button
                            type="button"
                            className={`tab flex-1 ${!useOTP ? 'tab-active' : ''}`}
                            onClick={() => {
                                setUseOTP(false);
                                setCode('');
                                setOtpSent(false);
                                setError('');
                            }}
                        >
                            Current Password
                        </button>
                    </div>
                </div>

                {useOTP && !otpSent && (
                    <div className="mb-4">
                        <p className="text-base-content/70 mb-4">
                            We'll send a verification code to <span className="font-semibold">{session?.user?.email}</span>
                        </p>
                        <button
                            type="button"
                            className="btn btn-primary w-full"
                            onClick={sendOTP}
                            disabled={sendingOTP}
                        >
                            {sendingOTP ? (
                                <span className="flex items-center gap-2">
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Sending Code...
                                </span>
                            ) : (
                                'Send Verification Code'
                            )}
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {useOTP && otpSent && (
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Verification Code</span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered w-full text-center tracking-widest font-bold"
                                maxLength={6}
                                placeholder="000000"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                autoComplete="one-time-code"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                required={useOTP}
                            />
                            <label className="label">
                                <span className="label-text-alt">Check your email for the 6-digit code</span>
                            </label>
                        </div>
                    )}

                    {!useOTP && (
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Current Password</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    className="input input-bordered w-full pr-10"
                                    placeholder="••••••••"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required={!useOTP}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    {showCurrentPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">New Password</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="input input-bordered w-full pr-10"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    minLength={8}
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <label className="label">
                                <span className="label-text-alt">Minimum 8 characters</span>
                            </label>
                        </div>

                    <div className="modal-action">
                        <button type="button" className="btn" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Updating...
                                </span>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </div>
                </form>

                {useOTP && otpSent && (
                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={sendOTP}
                            disabled={sendingOTP}
                        >
                            {sendingOTP ? 'Sending...' : 'Resend Code'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    if (typeof window !== 'undefined') {
        return createPortal(modalContent, document.body);
    }
    return null;
}
