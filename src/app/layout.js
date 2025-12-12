import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import NumberInputProtection from "@/components/NumberInputProtection";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FinFlow42",
  description: "Advanced Financial Tracking",
};

export const viewport = {
  themeColor: "#1a1a2e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="finflow">
      <body className={`${inter.className} antialiased min-h-screen bg-base-200 text-base-content`}>
        <Providers>
          <NumberInputProtection />
          {children}
        </Providers>
      </body>
    </html>
  );
}
