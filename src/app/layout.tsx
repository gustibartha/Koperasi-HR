import type { Metadata } from "next";
import { Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-sans", // Mapping Geist Mono to sans as requested in globals.css
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Koperasi Wira Karyawan",
  description: "Sistem HR & Koperasi Digital Terintegrasi",
};

import { CompanyProvider } from "@/context/CompanyContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} ${jetbrainsMono.variable} dark h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col selection:bg-primary/30 tracking-tight overflow-x-hidden">
        <CompanyProvider>
          {children}
        </CompanyProvider>
      </body>
    </html>
  );
}
