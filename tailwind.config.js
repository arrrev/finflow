/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [require("daisyui")],
    daisyui: {
        themes: [
            {
                finflow: {
                    "primary": "#6366f1", // Indigo-500
                    "primary-content": "#ffffff",
                    "secondary": "#8b5cf6", // Purple-500
                    "accent": "#1e3a8a", // Navy-800
                    "neutral": "#1f2937", // Gray-800
                    "base-100": "#1e293b", // Slate-800 (Lighter Background)
                    "base-200": "#334155", // Slate-700 (Cards)
                    "base-300": "#475569", // Slate-600 (Borders)
                    "base-content": "#f1f5f9", // Slate-100 (Text)
                    "info": "#3b82f6",
                    "success": "#10b981",
                    "warning": "#f59e0b",
                    "error": "#ef4444",
                },
            },
            "light",
        ],
    },
};
