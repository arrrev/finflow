export default function manifest() {
    return {
        name: 'FinFlow Finance Tracker',
        short_name: 'FinFlow',
        description: 'Track your finances with ease.',
        start_url: '/',
        display: 'standalone',
        background_color: '#1a1a2e',
        theme_color: '#fbbf24',
        icons: [
            {
                src: '/web-app-manifest-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/web-app-manifest-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
