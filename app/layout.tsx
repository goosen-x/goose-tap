import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { GameProvider } from "@/components/GameProvider";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Goose Tap",
  description: "Telegram Mini App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <GameProvider>
          <div className="flex h-screen flex-col">
            <div className="fixed top-0 left-0 right-0 z-10">
              <Header />
            </div>
            <div className="flex-1 overflow-auto pt-[52px] pb-[52px]">
              {children}
            </div>
            <div className="fixed bottom-0 left-0 right-0 z-10">
              <BottomNav />
            </div>
          </div>
        </GameProvider>
      </body>
    </html>
  );
}
