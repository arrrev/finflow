"use client";
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function TermsAndConditionsPage() {
    const { data: session } = useSession();

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {!session && (
                <div className="mb-4">
                    <Link href="/auth/signin" className="btn btn-ghost btn-sm gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Login
                    </Link>
                </div>
            )}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body p-4 md:p-8">
                    <h1 className="text-4xl font-bold mb-6">Terms and Conditions</h1>
                    <p className="text-sm text-base-content/60 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                    <div className="prose max-w-none space-y-6">
                        <section>
                            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                By accessing and using FinFlow42, you accept and agree to be bound by the terms and provision of this agreement. 
                                If you do not agree to these Terms and Conditions, please do not use our service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                FinFlow42 is a personal finance management platform that allows users to track expenses, manage budgets, 
                                analyze spending patterns, and manage multiple accounts and currencies. The service is provided "as is" 
                                and "as available" without warranties of any kind.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                            <div className="space-y-3">
                                <p className="text-base-content/80 leading-relaxed">
                                    To use our service, you must:
                                </p>
                                <ul className="list-disc list-inside ml-4 space-y-1 text-base-content/80">
                                    <li>Create an account with accurate and complete information</li>
                                    <li>Maintain the security of your account credentials</li>
                                    <li>Notify us immediately of any unauthorized access</li>
                                    <li>Be at least 18 years old</li>
                                </ul>
                                <p className="text-base-content/80 leading-relaxed mt-3">
                                    You are responsible for all activities that occur under your account.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
                            <p className="text-base-content/80 leading-relaxed mb-3">
                                You agree to:
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-1 text-base-content/80">
                                <li>Use the service only for lawful purposes</li>
                                <li>Provide accurate and truthful information</li>
                                <li>Not attempt to gain unauthorized access to the system</li>
                                <li>Not use the service to transmit malicious code or spam</li>
                                <li>Not interfere with or disrupt the service</li>
                                <li>Respect intellectual property rights</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">5. Financial Information</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                FinFlow42 is a tool for tracking and managing your personal finances. We do not provide financial advice, 
                                investment recommendations, or guarantee the accuracy of financial calculations. You are solely responsible 
                                for your financial decisions and the accuracy of the data you enter.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">6. Data Accuracy</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                While we strive to provide accurate calculations and reports, we cannot guarantee the accuracy of all data. 
                                You are responsible for verifying the accuracy of your financial information and should not rely solely on 
                                our platform for critical financial decisions.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">7. Service Availability</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                We strive to maintain high availability of our service, but we do not guarantee uninterrupted access. 
                                The service may be temporarily unavailable due to maintenance, updates, or unforeseen circumstances. 
                                We are not liable for any losses resulting from service unavailability.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                All content, features, and functionality of FinFlow42, including but not limited to text, graphics, logos, 
                                and software, are the property of FinFlow42 and are protected by copyright, trademark, and other intellectual 
                                property laws. You may not reproduce, distribute, or create derivative works without our written permission.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                To the maximum extent permitted by law, FinFlow42 shall not be liable for any indirect, incidental, special, 
                                consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, 
                                or any loss of data, use, goodwill, or other intangible losses resulting from your use of the service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                You agree to indemnify and hold harmless FinFlow42, its officers, directors, employees, and agents from any 
                                claims, damages, losses, liabilities, and expenses (including legal fees) arising out of or related to your 
                                use of the service, violation of these terms, or infringement of any rights of another.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                We reserve the right to suspend or terminate your account at any time, with or without notice, for any 
                                violation of these Terms and Conditions or for any other reason we deem necessary. You may also terminate 
                                your account at any time by contacting us or using the account deletion feature.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">12. Modifications to Terms</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                We reserve the right to modify these Terms and Conditions at any time. We will notify users of any material 
                                changes by posting the updated terms on this page. Your continued use of the service after such modifications 
                                constitutes acceptance of the updated terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                These Terms and Conditions shall be governed by and construed in accordance with applicable laws, without 
                                regard to conflict of law provisions.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                If you have any questions about these Terms and Conditions, please contact us at:
                            </p>
                            <p className="text-base-content/80 leading-relaxed mt-2">
                                <strong>Email:</strong> legal@finflow42.com
                            </p>
                        </section>
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div className="text-center py-4 md:py-8">
                {!session ? (
                    <div className="space-y-4">
                        <p className="text-base md:text-lg text-base-content/70">Ready to take control of your finances?</p>
                        <div className="flex justify-center items-center">
                            <Link href="/register" className="btn btn-primary btn-lg w-full sm:w-auto min-w-[140px]">
                                Get Started
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-base md:text-lg text-base-content/70">Need help? Check out the features above or explore the app!</p>
                        <Link href="/" className="btn btn-primary btn-lg w-full sm:w-auto">
                            Go to Dashboard
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

