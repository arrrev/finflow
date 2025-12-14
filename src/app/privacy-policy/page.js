"use client";
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function PrivacyPolicyPage() {
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
                    <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
                    <p className="text-sm text-base-content/60 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                    <div className="prose max-w-none space-y-6">
                        <section>
                            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                Welcome to FinFlow42. We are committed to protecting your privacy and ensuring the security of your personal information. 
                                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our financial 
                                management platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">2.1 Personal Information</h3>
                                    <p className="text-base-content/80 leading-relaxed">
                                        We collect personal information that you provide directly to us, including:
                                    </p>
                                    <ul className="list-disc list-inside ml-4 space-y-1 text-base-content/80">
                                        <li>Name and email address</li>
                                        <li>Financial transaction data</li>
                                        <li>Account information</li>
                                        <li>Category and budget preferences</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">2.2 Authentication Information</h3>
                                    <p className="text-base-content/80 leading-relaxed">
                                        When you register or sign in, we collect authentication information including:
                                    </p>
                                    <ul className="list-disc list-inside ml-4 space-y-1 text-base-content/80">
                                        <li>Email address and password (encrypted)</li>
                                        <li>Session tokens and authentication cookies</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                            <p className="text-base-content/80 leading-relaxed mb-3">
                                We use the information we collect to:
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-1 text-base-content/80">
                                <li>Provide, maintain, and improve our services</li>
                                <li>Process and manage your financial transactions</li>
                                <li>Generate financial reports and analytics</li>
                                <li>Send you important updates and notifications</li>
                                <li>Protect against fraud and unauthorized access</li>
                                <li>Comply with legal obligations</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                We implement industry-standard security measures to protect your personal information, including:
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-1 text-base-content/80 mt-3">
                                <li>Encryption of sensitive data in transit and at rest</li>
                                <li>Secure password hashing using bcrypt</li>
                                <li>Regular security audits and updates</li>
                                <li>Access controls and authentication mechanisms</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-1 text-base-content/80 mt-3">
                                <li>With your explicit consent</li>
                                <li>To comply with legal obligations or court orders</li>
                                <li>To protect our rights, privacy, safety, or property</li>
                                <li>In connection with a business transfer or merger</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">6. Third-Party Services</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                Our platform may integrate with third-party services (such as Google Sign-In) for authentication. 
                                These services have their own privacy policies, and we encourage you to review them.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
                            <p className="text-base-content/80 leading-relaxed mb-3">
                                You have the right to:
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-1 text-base-content/80">
                                <li>Access and review your personal information</li>
                                <li>Request correction of inaccurate data</li>
                                <li>Request deletion of your account and data</li>
                                <li>Opt-out of certain communications</li>
                                <li>Export your data in a portable format</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                We use cookies and similar technologies to maintain your session, remember your preferences, 
                                and improve your experience. You can control cookie settings through your browser preferences.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">9. Data Retention</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                We retain your personal information for as long as necessary to provide our services and comply 
                                with legal obligations. When you delete your account, we will delete or anonymize your data 
                                within a reasonable timeframe.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                Our services are not intended for individuals under the age of 18. We do not knowingly collect 
                                personal information from children.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                We may update this Privacy Policy from time to time. We will notify you of any material changes 
                                by posting the new policy on this page and updating the "Last updated" date.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
                            </p>
                            <p className="text-base-content/80 leading-relaxed mt-2">
                                <strong>Email:</strong> privacy@finflow42.com
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

