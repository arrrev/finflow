"use client";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { ToasterProvider } from "@/components/Toaster";

export default function Providers({ children }) {
    return (
        <SessionProvider>
            <ToasterProvider>
                <div className="min-h-screen bg-base-200 p-4 font-sans">
                    <div className="max-w-5xl mx-auto">
                        <Navbar />
                        {children}
                    </div>
                </div>
            </ToasterProvider>
        </SessionProvider>
    );
}
