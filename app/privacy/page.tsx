"use client";

import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Shield, Lock, Eye, FileText } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="relative pt-32 pb-12 bg-accent/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We are committed to protecting your personal information and your
            right to privacy.
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
                "Information Collection",
                "How we use it",
                "Sharing",
                "Security",
                "User Rights",
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

            <section id="information-collection" className="scroll-mt-24">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground mt-0">
                <FileText className="w-6 h-6 text-primary" />
                1. Information We Collect
              </h2>
              <p>
                We collect information you provide directly to us, such as when
                you create an account, update your profile, make a contribution,
                or communicate with us. This may include your name, email
                address, phone number, and payment information.
              </p>
            </section>

            <hr className="border-border my-12" />

            <section id="how-we-use-it" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">
                2. How We Use Your Information
              </h2>
              <p>
                We use the information we collect to provide, maintain, and
                improve our services, to process transactions, to send you
                technical notices and support messages, and to communicate with
                you about news and events.
              </p>
            </section>

            <hr className="border-border my-12" />

            <section id="sharing" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">
                3. Information Sharing
              </h2>
              <p>
                We do not share your personal information with third parties
                except as described in this policy, such as with payment
                processors to facilitate your contributions, or as required by
                law.
              </p>
            </section>

            <hr className="border-border my-12" />

            <section id="security" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">
                4. Data Security
              </h2>
              <p>
                We take reasonable measures to help protect information about
                you from loss, theft, misuse, and unauthorized access,
                disclosure, alteration, and destruction.
              </p>
            </section>

            <hr className="border-border my-12" />

            <section id="user-rights" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">
                5. Your Rights
              </h2>
              <p>
                You have the right to access, correct, or delete your personal
                information. You can manage your information through your
                account settings or by contacting us.
              </p>
            </section>

            <div className="mt-12 p-6 rounded-2xl bg-primary/5 border border-primary/10">
              <h3 className="text-lg font-semibold mb-2">
                Have specific privacy questions?
              </h3>
              <p className="mb-4 text-muted-foreground">
                Our Data Protection Officer can help.
              </p>
              <Link
                href="mailto:privacy@farewell.app"
                className="text-primary font-medium hover:underline"
              >
                Contact privacy@farewell.app
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
