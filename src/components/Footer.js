"use client";
import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="max-w-5xl mx-auto w-full mt-8 py-6 border-t border-base-300">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-4">
                {/* Left side - Links */}
                <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 text-sm">
                    <Link 
                        href="/how-it-works" 
                        className="link link-hover text-base-content/70 hover:text-base-content"
                    >
                        How It Works
                    </Link>
                    <Link 
                        href="/privacy-policy" 
                        className="link link-hover text-base-content/70 hover:text-base-content"
                    >
                        Privacy Policy
                    </Link>
                    <Link 
                        href="/terms-and-conditions" 
                        className="link link-hover text-base-content/70 hover:text-base-content"
                    >
                        Terms & Conditions
                    </Link>
                </div>

                {/* Center - Buy Me a Coffee */}
                <div className="flex-shrink-0">
                    <a
                        href="https://buymeacoffee.com/finflow"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm gap-2 bg-[#FFDD00] hover:bg-[#FFED4E] text-black border-none"
                    >
                        <span className="text-lg">☕</span>
                        <span className="font-semibold">Buy Me a Coffee</span>
                    </a>
                </div>

                {/* Right side - Copyright */}
                <div className="text-sm text-base-content/60 text-center md:text-right">
                    <p>© {currentYear} FinFlow42. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

