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
                    "primary": "#fbbf24", // Yellow-400
                    "primary-content": "#0f172a", // Slate-900 text on primary
                    "secondary": "#38bdf8", // Sky-400
                    "accent": "#f472b6", // Pink-400
                    "neutral": "#1e293b", // Slate-800
                    "base-100": "#0f172a", // Slate-900 (Dark Blue Background)
                    "base-content": "#f8fafc", // Slate-50 text
                    "info": "#3abff8",
                    "success": "#36d399",
                    "warning": "#fbbd23",
                    "error": "#f87272",
                },
            },
            "light",
        ],
    },
};
