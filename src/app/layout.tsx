import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Investigation Board Platform - Intelligence Investigation System",
  description: "Professional intelligence investigation and evidence management platform. Organize events, track relationships, and manage investigation projects with an interactive board interface.",
  keywords: ["investigation", "intelligence", "evidence management", "case management", "investigation board", "timeline", "events"],
  authors: [{ name: "Investigation Board Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Investigation Board Platform",
    description: "Professional intelligence investigation and evidence management platform",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Investigation Board Platform",
    description: "Professional intelligence investigation and evidence management platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
