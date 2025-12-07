"use client";

import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Cookie, Shield, Lock, Info } from "lucide-react";
import Link from "next/link";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <div className="relative pt-32 pb-12 bg-accent/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
            <Cookie className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Transparent information about how we use cookies to improve your
            experience.
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3 lg:sticky lg:top-24 h-fit hidden lg:block">
            <nav className="flex flex-col space-y-2">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                On this page
              </p>
              {[
                "What are cookies",
                "How we use them",
                "Managing cookies",
                "Updates",
              ].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-sm"
                >
                  {item}
                </Link>
              ))}
            </nav>
            <div className="mt-8 p-6 rounded-2xl bg-accent/30 border border-border/50">
              <Shield className="w-6 h-6 text-primary mb-3" />
              <h4 className="font-bold text-sm mb-1">Your Privacy Matters</h4>
              <p className="text-xs text-muted-foreground mb-3">
                We respect your data rights.
              </p>
              <Link
                href="/privacy"
                className="text-xs font-medium text-primary hover:underline"
              >
                Read Privacy Policy
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-8 prose dark:prose-invert max-w-none">
            <p className="lead text-xl text-muted-foreground">
              Effective Date: November 30, 2025
            </p>

            <section id="what-are-cookies" className="scroll-mt-24">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mt-0">
                <Info className="w-6 h-6 text-primary" />
                1. What Are Cookies?
              </h2>
              <p>
                Cookies are small text files that are placed on your computer or
                mobile device when you visit a website. They are widely used to
                make websites work more efficiently and to provide information
                to the owners of the site.
              </p>
            </section>

            <hr className="border-border my-12" />

            <section id="how-we-use-them" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">
                2. How We Use Cookies
              </h2>
              <p>We use cookies for the following purposes:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose my-6">
                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="font-bold mb-1 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-500" /> Essential
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Required for core features like logging in and secure
                    payments.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="font-bold mb-1 flex items-center gap-2">
                    <Cookie className="w-4 h-4 text-blue-500" /> Functional
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Store your preferences like language and theme (Dark/Light).
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-border my-12" />

            <section id="managing-cookies" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">
                3. Managing Cookies
              </h2>
              <p>
                Most web browsers allow some control of most cookies through the
                browser settings. To find out more about cookies, including how
                to see what cookies have been set, visit{" "}
                <a
                  href="http://www.aboutcookies.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary no-underline hover:underline"
                >
                  www.aboutcookies.org
                </a>
                .
              </p>
            </section>

            <hr className="border-border my-12" />

            <section id="updates" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">
                4. Updates to This Policy
              </h2>
              <p>
                We may update this Cookie Policy from time to time in order to
                reflect, for example, changes to the cookies we use or for other
                operational, legal or regulatory reasons. Please therefore
                re-visit this Cookie Policy regularly to stay informed about our
                use of cookies and related technologies.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
