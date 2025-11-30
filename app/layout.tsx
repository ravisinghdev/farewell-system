import React from "react";
import type { Metadata, Viewport } from "next";
import Provider from "./Provider";
import "./globals.css";
import { Toaster } from "sonner";
import { GeminiAssistant } from "@/components/ai/GeminiAssistant";

// Metadata configuration for SEO and social sharing
export const metadata: Metadata = {
  title: {
    default: "Farewell Management System",
    template: "%s | Farewell System",
  },
  description:
    "Comprehensive school farewell management system with contributions tracking, photo galleries, real-time chat, and administrative controls.",
  keywords: [
    "farewell",
    "school management",
    "contributions",
    "gallery",
    "chat",
    "student management",
  ],
  authors: [{ name: "Farewell System Team" }],
  creator: "Farewell System",
  publisher: "Farewell System",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Farewell Management System",
    title: "Farewell Management System",
    description:
      "Manage school farewell events with ease - contributions, galleries, and real-time chat.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Farewell Management System",
    description:
      "Manage school farewell events with ease - contributions, galleries, and real-time chat.",
  },
};

// Viewport configuration
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

/**
 * Root Layout Component
 *
 * Provides application-wide configuration and wrappers:
 * - HTML lang attribute for accessibility
 * - Suppressed hydration warnings for theme switching
 * - Global theme provider
 * - Toast notification system
 *
 * @param {React.ReactNode} children - Page content
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <Provider>
          {children}
          <Toaster />
          <GeminiAssistant />
        </Provider>
      </body>
    </html>
  );
}
