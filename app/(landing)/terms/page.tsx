"use client";

import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Scale, Gavel, Users, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="relative pt-32 pb-12 bg-accent/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            The rules and regulations for using the Farewell System.
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-3 lg:sticky lg:top-24 h-fit hidden lg:block">
            <nav className="flex flex-col space-y-2">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                On this page
              </p>
              {[
                "Acceptance",
                "Service Description",
                "User Accounts",
                "Content",
                "Payments",
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
          </div>

          <div className="lg:col-span-8 prose dark:prose-invert max-w-none">
            <p className="lead text-xl text-muted-foreground">
              Last updated: November 30, 2025
            </p>

            <section id="acceptance" className="scroll-mt-24">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mt-0">
                <Gavel className="w-6 h-6 text-primary" />
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing and using the Farewell System ("the Service"), you
                agree to be bound by these Terms of Service. If you do not agree
                to these terms, please do not use the Service.
              </p>
            </section>

            <hr className="border-border my-12" />

            <section id="service-description" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">
                2. Description of Service
              </h2>
              <p>
                The Service provides a platform for organizing school farewell
                events, managing contributions, sharing memories, and
                facilitating communication among members.
              </p>
            </section>

            <hr className="border-border my-12" />

            <section id="user-accounts" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">
                3. User Accounts
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your
                account credentials and for all activities that occur under your
                account. You agree to notify us immediately of any unauthorized
                use of your account.
              </p>
            </section>

            <hr className="border-border my-12" />

            <section id="content" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">
                4. Content and Conduct
              </h2>
              <p>
                You retain ownership of the content you post but grant us a
                license to use, store, and display it for the purpose of
                providing the Service. You agree not to post content that is
                illegal, offensive, or violates the rights of others.
              </p>
            </section>

            <hr className="border-border my-12" />

            <section id="payments" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">
                5. Contributions and Payments
              </h2>
              <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 mb-4 flex gap-3 items-start not-prose">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Important: We are not a bank. We facilitate transactions via
                  Razorpay.
                </p>
              </div>
              <p>
                All financial contributions are processed through third-party
                payment processors. We are not responsible for the processing of
                payments or the management of funds once collected, other than
                providing the tracking tools.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
