"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    first_name: formData.first_name,
                    last_name: formData.last_name
                })
            });

            const data = await res.json();

            if (res.ok) {
                router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}`);
            } else {
                setError(data.error || 'Registration failed');
                setLoading(false);
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0a0f]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />

            <div className="relative w-full max-w-md px-6 py-10 z-10">
                <div className="text-center mb-10 space-y-3">
                    <h1 className="text-5xl font-black tracking-tight text-white">
                        Create Account
                    </h1>
                    <p className="text-gray-500 text-sm font-medium tracking-wide">
                        Get started with FinFlow today
                    </p>
                </div>

                <div className="relative bg-[#13131a] backdrop-blur-xl p-8 rounded-2xl border border-white/5 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                name="first_name"
                                placeholder="First Name"
                                className="w-full px-5 py-3.5 bg-[#1a1a24] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200"
                                required
                                value={formData.first_name}
                                onChange={handleChange}
                            />
                            <input
                                type="text"
                                name="last_name"
                                placeholder="Last Name"
                                className="w-full px-5 py-3.5 bg-[#1a1a24] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200"
                                required
                                value={formData.last_name}
                                onChange={handleChange}
                            />
                        </div>

                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            className="w-full px-5 py-3.5 bg-[#1a1a24] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200"
                            required
                            value={formData.email}
                            onChange={handleChange}
                        />

                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            className="w-full px-5 py-3.5 bg-[#1a1a24] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200"
                            required
                            value={formData.password}
                            onChange={handleChange}
                        />

                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            className="w-full px-5 py-3.5 bg-[#1a1a24] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold shadow-lg hover:shadow-xl active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <span className="loading loading-spinner loading-sm text-black"></span>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#13131a] px-4 text-gray-600 font-semibold tracking-wider">Or</span>
                        </div>
                    </div>

                    <button
                        onClick={() => signIn('google', { callbackUrl: '/' })}
                        className="w-full py-3.5 bg-[#1a1a24] hover:bg-[#20202c] border border-white/10 text-gray-300 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3"
                        type="button"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clipPath="url(#clip0_24_24)">
                                <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4" />
                                <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853" />
                                <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC05" />
                                <path d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z" fill="#EA4335" />
                            </g>
                        </svg>
                        Sign up with Google
                    </button>

                    <p className="text-center mt-8 text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link href="/auth/signin" className="font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
