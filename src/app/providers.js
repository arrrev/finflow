"use client";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { ToasterProvider } from "@/components/Toaster";
import SessionRefresher from "@/components/SessionRefresher";

export default function Providers({ children }) {
    return (
        <SessionProvider>
            <SessionRefresher />
            <ToasterProvider>
                <div className="min-h-screen bg-base-200 p-2 sm:p-4 font-sans flex flex-col">
                    <div className="max-w-5xl mx-auto flex-1 w-full pt-16 sm:pt-28">
                        <Navbar />
                        {children}
                    </div>
                    <footer className="max-w-5xl mx-auto w-full mt-8 py-6 text-center">
                        <a
                            href="https://buymeacoffee.com/finflow"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm gap-2 bg-[#FFDD00] hover:bg-[#FFED4E] text-black border-none"
                        >
                            <span className="text-lg">☕</span>
                            <span className="font-semibold">Buy Me a Coffee</span>
                        </a>
                    </footer>
                </div>
            </ToasterProvider>
        </SessionProvider>
    );
}
