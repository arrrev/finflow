"use client";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { ToasterProvider } from "@/components/Toaster";

export default function Providers({ children }) {
    return (
        <SessionProvider>
            <ToasterProvider>
                <div className="min-h-screen bg-base-200 p-4 font-sans flex flex-col">
                    <div className="max-w-5xl mx-auto flex-1 w-full">
                        <Navbar />
                        {children}
                    </div>
                    <footer className="max-w-5xl mx-auto w-full mt-8 py-4 text-center">
                        <a
                            href="https://buymeacoffee.com/finflow"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity"
                        >
                            <span>☕</span>
                            <span>Support FinFlow</span>
                        </a>
                    </footer>
                </div>
            </ToasterProvider>
        </SessionProvider>
    );
}
