import type { Metadata } from "next";
import { Barlow, Bebas_Neue, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
});

const barlow = Barlow({
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Steel City Bus Tracker",
  description: "Pittsburgh transit routes, live bus tracking, and trip planning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bebas.variable} ${barlow.variable} ${geistMono.variable} min-h-screen bg-black text-zinc-100 antialiased`}
      >
        <Providers>
          <SiteNav />
          <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
