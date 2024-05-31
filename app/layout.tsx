import "./globals.css";

import { Toaster, toast } from "sonner";

import { Analytics } from "@vercel/analytics/react";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "图片生成器 ｜ AI Image",
  description:
    "图片生成器，利用 AI 技术生成高清精美的图片。",
  keywords: "AI, 图片, AI 图片, AI Image",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Toaster position="top-center" richColors />
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
