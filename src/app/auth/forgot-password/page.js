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
        <div className="min-h-screen w-full flex items-center justify-center bg-[#fbfbfd]">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 via-purple-50/30 to-white pointer-events-none" />

            <div className="relative w-full max-w-[400px] px-6">
                <div className="text-center mb-10 space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                        Forgot Password
                    </h1>
                    <p className="text-gray-500 text-base">
                        Enter your email to receive a reset code
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-500 text-sm rounded-xl text-center font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <input
                                type="email"
                                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-[15px]"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-medium shadow-lg shadow-gray-900/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <span className="loading loading-spinner loading-sm text-white/80"></span> : 'Send Code'}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <Link href={status === 'authenticated' ? "/" : "/auth/signin"} className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
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
        <Suspense fallback={<div className="min-h-screen bg-[#fbfbfd]" />}>
            <ForgotPasswordContent />
        </Suspense>
    );
}
