"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const [theme, setTheme] = useState("finflow");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("theme") || "finflow";
        setTheme(stored);
        document.documentElement.setAttribute("data-theme", stored);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "finflow" ? "light" : "finflow";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    if (!mounted) {
        // Render a placeholder or nothing to avoid hydration mismatch
        // But rendering a static icon is better
        return <div className="w-6 h-6" />;
    }

    return (
        <label className="swap swap-rotate btn btn-ghost btn-circle" style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
            <input
                type="checkbox"
                onChange={toggleTheme}
                onClick={toggleTheme}
                checked={theme === "light"}
                style={{ cursor: 'pointer' }}
            />

            {/* Sun icon (for Light Mode) */}
            <svg
                className="swap-on h-6 w-6 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24">
                <path
                    d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,4.93,1,1,0,0,0,5.64,7.05Zm12.02.71a1,1,0,0,0,.71.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71a1,1,0,0,0-1.41,1.41ZM16.29,14.29a1,1,0,1,0,1.41,1.41l.71.71a1,1,0,0,0,1.41-1.41L19,14.29A1,1,0,0,0,16.29,14.29Zm1.41-5a1,1,0,0,0,1.41.71l.71-.71a1,1,0,0,0-1.41-1.41l-.71.71A1,1,0,0,0,17.7,10ZM12,7a5,5,0,1,0,5,5A5,5,0,0,0,12,7Zm0,8a3,3,0,1,1,3-3A3,3,0,0,1,12,15Z" />
            </svg>

            {/* Moon icon (for Dark Mode) */}
            <svg
                className="swap-off h-6 w-6 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24">
                <path
                    d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
            </svg>
        </label>
    );
}
