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
          <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-3xl rounded-2xl bg-slate-900/80 p-6 shadow-xl ring-1 ring-slate-800">
              {children}
              <Analytics />
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
