/**
 * @fileoverview Shared metadata configurations for the application.
 *
 * Centralized metadata templates to ensure consistency across pages
 * and reduce duplication. Import and extend these configs in your pages.
 *
 * @module lib/metadata
 */

import type { Metadata } from "next";

/**
 * Base site configuration
 */
export const siteConfig = {
  name: "Farewell Management System",
  description:
    "Comprehensive school farewell management system with contributions tracking, photo galleries, real-time chat, and administrative controls.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://farewell-system.com",
  ogImage: "/og-image.png",
};

/**
 * Creates metadata for auth pages
 */
export function createAuthMetadata(
  title: string,
  description?: string
): Metadata {
  return {
    title,
    description:
      description || `${title} to access your farewell management dashboard.`,
  };
}

/**
 * Creates metadata for dashboard pages
 */
export function createDashboardMetadata(
  title: string,
  description?: string
): Metadata {
  return {
    title,
    description: description || `Manage your farewell ${title.toLowerCase()}.`,
  };
}

/**
 * Default metadata template
 */
export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "farewell",
    "school management",
    "contributions",
    "gallery",
    "chat",
    "student management",
    "events",
  ],
  authors: [{ name: "Farewell System Team" }],
  creator: "Farewell System",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
