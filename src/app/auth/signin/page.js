"use client";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

function SignInContent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
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
            rememberMe: rememberMe.toString(),
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
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <span className="loading loading-dots loading-lg"></span>
            </div>
        );
    }

    // Don't render signin form if already authenticated (will redirect)
    if (status === 'authenticated') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200 flex items-center justify-center p-4 relative overflow-y-auto">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle />
            </div>
            <div className="w-full max-w-5xl grid md:grid-cols-2 gap-4 md:gap-6 items-center relative z-10 px-2 sm:px-4">
                {/* Left Side - Information & Image */}
                <div className="hidden md:block space-y-4">
                    <div className="text-center md:text-left space-y-3">
                        <h1 className="text-5xl font-extrabold text-base-content mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient">
                            FinFlow
                        </h1>
                        <p className="text-xl text-base-content/80 font-medium">
                            Your Personal Financial Management Platform
                        </p>
                        <p className="text-sm text-base-content/60">
                            Take control of your finances with smart analytics and intuitive budgeting tools.
                        </p>
                    </div>

                    {/* Features List - Enhanced */}
                    <div className="space-y-3 mt-4">
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-base-100/50 backdrop-blur-sm border border-base-300/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-base-content mb-1.5 text-lg">Smart Analytics</h3>
                                <p className="text-sm text-base-content/70 leading-relaxed">Track your spending patterns and get insights into your financial habits</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-xl bg-base-100/50 backdrop-blur-sm border border-base-300/50 hover:border-secondary/30 transition-all duration-300 hover:shadow-lg">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08.402-2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-base-content mb-1.5 text-lg">Multi-Currency Support</h3>
                                <p className="text-sm text-base-content/70 leading-relaxed">Manage accounts in different currencies with automatic conversion</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-xl bg-base-100/50 backdrop-blur-sm border border-base-300/50 hover:border-accent/30 transition-all duration-300 hover:shadow-lg">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-base-content mb-1.5 text-lg">Secure & Private</h3>
                                <p className="text-sm text-base-content/70 leading-relaxed">Your financial data is encrypted and stored securely</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-xl bg-base-100/50 backdrop-blur-sm border border-base-300/50 hover:border-success/30 transition-all duration-300 hover:shadow-lg">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-base-content mb-1.5 text-lg">Fast & Intuitive</h3>
                                <p className="text-sm text-base-content/70 leading-relaxed">Quick transaction entry and real-time balance updates</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full max-w-md mx-auto">
                    {/* Logo/Brand for Mobile */}
                    <div className="text-center mb-8 md:hidden">
                        <h1 className="text-5xl font-extrabold text-base-content mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                            FinFlow
                        </h1>
                        <p className="text-base-content/70 text-lg">
                            Sign in to your account
                        </p>
                    </div>

                    {/* Form Card - Enhanced */}
                    <div className="card bg-base-100/95 backdrop-blur-md shadow-2xl border border-base-300/50 hover:shadow-3xl transition-all duration-300">
                        <div className="card-body p-4 sm:p-6 md:p-8">
                                {success && (
                                <div className="alert alert-success mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{success}</span>
                                </div>
                            )}

                            {error && (
                                <div className="alert alert-error mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Email</span>
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        className="input input-bordered w-full"
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
                                            className="input input-bordered w-full pr-10"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
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
                                        <Link href="/auth/forgot-password" className="label-text-alt link link-hover text-primary">
                                            Forgot password?
                                        </Link>
                                    </label>
                                </div>

                                <div className="form-control">
                                    <label className="label cursor-pointer justify-start gap-2">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-primary"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                        />
                                        <span className="label-text">Remember Me</span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                                    disabled={loading}
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </button>
                            </form>

                            <div className="divider my-6">OR</div>

                            <button
                                onClick={() => signIn('google', { callbackUrl: '/' })}
                                className="btn btn-outline w-full gap-2"
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

                            <div className="text-center mt-6 space-y-2">
                                <p className="text-sm text-base-content/60">
                                    Don't have an account?{' '}
                                    <Link href="/register" className="link link-primary font-semibold">
                                        Create one now
                                    </Link>
                                </p>
                                <p className="text-xs text-base-content/50">
                                    <Link href="/how-it-works" className="link link-hover">
                                        Learn how it works
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SignIn() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-base-200"><span className="loading loading-dots loading-lg"></span></div>}>
            <SignInContent />
        </Suspense>
    );
}
