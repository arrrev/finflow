"use client";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToasterProvider } from "@/components/Toaster";
import SessionRefresher from "@/components/SessionRefresher";
import ReCaptchaProvider from "@/components/ReCaptchaProvider";

export default function Providers({ children }) {
    return (
        <SessionProvider>
            <ReCaptchaProvider>
                <SessionRefresher />
                <ToasterProvider>
                <div className="min-h-screen bg-base-200 p-2 sm:p-4 font-sans flex flex-col">
                    <div className="max-w-5xl mx-auto flex-1 w-full pt-16 sm:pt-28">
                        <Navbar />
                        {children}
                    </div>
                    <Footer />
                </div>
            </ToasterProvider>
            </ReCaptchaProvider>
        </SessionProvider>
    );
}
