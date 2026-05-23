// 🐝 Mock DOMMatrix so the server build doesn't crash during prerendering
if (typeof window === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {};
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 🐝 CLEAN METADATA CONFIGURATION (Letting file-based icon engines take over)
export const metadata: Metadata = {
  title: "Iru-bee Literary Sanctuary",
  description: "A premium digital home for long-form narrative canvases, visual art exhibits, and standalone poetic verse.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#24211e]">
        {children}
      </body>
    </html>
  );
}