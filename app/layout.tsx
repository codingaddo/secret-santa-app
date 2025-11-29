import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/auth";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Secret Santa Gift Picker",
  description: "A simple Secret Santa assignment app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-50`}
      >
        <AuthProvider>
          <div
            className="relative flex min-h-screen items-center justify-center px-4 py-8 bg-cover bg-center bg-fixed"
            style={{ backgroundImage: "url(/bg.jpg)" }}
          >
            {/* Subtle gradient overlay for better readability */}
            <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/30 pointer-events-none" />

            <div className="relative w-full max-w-3xl rounded-3xl bg-white/35 backdrop-blur-xl p-8 shadow-2xl ring-1 ring-white/30 animate-glow">
              {/* Decorative corner accents */}
              <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-red-500/60 rounded-tl-xl" />
              <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-green-500/60 rounded-tr-xl" />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-green-500/60 rounded-bl-xl" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-red-500/60 rounded-br-xl" />

              {children}
              <Analytics />
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
