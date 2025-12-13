import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import NumberInputProtection from "@/components/NumberInputProtection";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://finflow42.com'),
  title: {
    default: "FinFlow42 - Personal Finance Tracker & Budget Manager",
    template: "%s | FinFlow42"
  },
  description: "Track your finances, manage budgets, and analyze spending with FinFlow42. Free personal finance tracker with multi-currency support, expense tracking, income management, and financial analytics.",
  keywords: [
    "personal finance tracker",
    "budget manager",
    "expense tracker",
    "financial management",
    "money tracker",
    "budgeting app",
    "finance app",
    "expense management",
    "income tracker",
    "financial analytics",
    "multi-currency finance",
    "spending tracker",
    "budget planner",
    "financial planning",
    "money management"
  ],
  authors: [{ name: "FinFlow42" }],
  creator: "FinFlow42",
  publisher: "FinFlow42",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "FinFlow42",
    title: "FinFlow42 - Personal Finance Tracker & Budget Manager",
    description: "Track your finances, manage budgets, and analyze spending with FinFlow42. Free personal finance tracker with multi-currency support.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FinFlow42 - Personal Finance Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinFlow42 - Personal Finance Tracker & Budget Manager",
    description: "Track your finances, manage budgets, and analyze spending with FinFlow42.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport = {
  themeColor: "#1a1a2e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://finflow42.com';
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "FinFlow42",
    "description": "Personal finance tracker and budget manager with multi-currency support, expense tracking, and financial analytics",
    "url": baseUrl,
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "100"
    },
    "featureList": [
      "Expense Tracking",
      "Income Management",
      "Multi-Currency Support",
      "Budget Planning",
      "Financial Analytics",
      "Transaction History",
      "Category Management",
      "Account Management"
    ]
  };

  return (
    <html lang="en" data-theme="finflow">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${inter.className} antialiased min-h-screen bg-base-200 text-base-content`}>
        <Providers>
          <NumberInputProtection />
          {children}
        </Providers>
      </body>
    </html>
  );
}
