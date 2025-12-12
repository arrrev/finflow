"use client";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status, router]);

    useEffect(() => {
        if (searchParams.get('registered') === 'true') {
            setSuccess('Registration successful! Please log in.');
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (res.error) {
            setError("Invalid credentials");
            setLoading(false);
        } else {
            router.push("/");
        }
    };

    // Show nothing while checking authentication
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span className="loading loading-dots loading-lg"></span>
            </div>
        );
    }

    // Don't render signin form if already authenticated (will redirect)
    if (status === 'authenticated') {
        return null;
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10">
            {/* Animated background blobs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary opacity-20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary opacity-20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent opacity-20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>

            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
                    {/* Left side - Branding */}
                    <div className="text-center md:text-left space-y-6 animate-fade-in-left">
                        <div className="space-y-2">
                            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient">
                                FinFlow
                            </h1>
                            <p className="text-2xl font-semibold text-base-content/80">
                                Financial Freedom Starts Here
                            </p>
                        </div>

                        <p className="text-lg text-base-content/60 max-w-md">
                            Track your expenses, plan your budget, and achieve your financial goals with our modern, intuitive platform.
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <div className="flex items-center gap-2 px-4 py-2 bg-base-100/50 rounded-full backdrop-blur">
                                <span className="text-2xl">📊</span>
                                <span className="text-sm font-medium">Smart Analytics</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-base-100/50 rounded-full backdrop-blur">
                                <span className="text-2xl">🔒</span>
                                <span className="text-sm font-medium">Secure & Private</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-base-100/50 rounded-full backdrop-blur">
                                <span className="text-2xl">⚡</span>
                                <span className="text-sm font-medium">Lightning Fast</span>
                            </div>
                        </div>
                    </div>

                    {/* Right side - Login form */}
                    <div className="animate-fade-in-right">
                        <div className="card bg-base-100/70 backdrop-blur-xl shadow-2xl border border-base-300/50">
                            <div className="card-body">
                                <h2 className="card-title text-3xl font-bold justify-center mb-2">
                                    Welcome Back
                                </h2>
                                <p className="text-center text-base-content/60 mb-6">
                                    Sign in to continue to your account
                                </p>

                                {success && (
                                    <div className="alert alert-success mb-4 animate-slide-down">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span>{success}</span>
                                    </div>
                                )}

                                {error && (
                                    <div className="alert alert-error mb-4 animate-shake">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Email</span>
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            className="input input-bordered w-full focus:input-primary transition-all"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Password</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="input input-bordered w-full pr-10 focus:input-primary transition-all"
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? '🙈' : '👁️'}
                                            </button>
                                        </div>
                                        <label className="label">
                                            <Link href="/auth/forgot-password" className="label-text-alt link link-hover text-primary">
                                                Forgot password?
                                            </Link>
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        className={`btn btn-primary w-full text-white font-semibold ${loading ? 'loading' : ''}`}
                                        disabled={loading}
                                    >
                                        {loading ? 'Signing in...' : 'Sign In'}
                                    </button>
                                </form>

                                <div className="divider">OR</div>

                                <button
                                    onClick={() => signIn('google', { callbackUrl: '/' })}
                                    className="btn btn-outline w-full gap-2 hover:bg-base-200 hover:border-base-300"
                                    type="button"
                                >
                                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <g clipPath="url(#clip0_24_24)">
                                            <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4" />
                                            <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853" />
                                            <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC05" />
                                            <path d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z" fill="#EA4335" />
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_24_24">
                                                <rect width="24" height="24" fill="white" />
                                            </clipPath>
                                        </defs>
                                    </svg>
                                    Continue with Google
                                </button>

                                <div className="divider">OR</div>

                                <div className="text-center">
                                    <p className="text-sm text-base-content/60">
                                        Don't have an account?{' '}
                                        <Link href="/register" className="link link-primary font-semibold hover:link-hover">
                                            Create one now
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -50px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(50px, 50px) scale(1.05); }
                }

                @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                @keyframes fade-in-left {
                    from {
                        opacity: 0;
                        transform: translateX(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes fade-in-right {
                    from {
                        opacity: 0;
                        transform: translateX(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }

                .animate-blob {
                    animation: blob 7s infinite;
                }

                .animation-delay-2000 {
                    animation-delay: 2s;
                }

                .animation-delay-4000 {
                    animation-delay: 4s;
                }

                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 3s ease infinite;
                }

                .animate-fade-in-left {
                    animation: fade-in-left 0.6s ease-out;
                }

                .animate-fade-in-right {
                    animation: fade-in-right 0.6s ease-out;
                }

                .animate-slide-down {
                    animation: slide-down 0.3s ease-out;
                }

                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
}

export default function SignIn() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="loading loading-dots loading-lg"></span></div>}>
            <SignInContent />
        </Suspense>
    );
}
