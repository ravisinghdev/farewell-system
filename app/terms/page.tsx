import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p>Last updated: November 30, 2025</p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using the Farewell System ("the Service"), you
              agree to be bound by these Terms of Service. If you do not agree
              to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              2. Description of Service
            </h2>
            <p>
              The Service provides a platform for organizing school farewell
              events, managing contributions, sharing memories, and facilitating
              communication among members.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your
              account. You agree to notify us immediately of any unauthorized
              use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              4. Content and Conduct
            </h2>
            <p>
              You retain ownership of the content you post but grant us a
              license to use, store, and display it for the purpose of providing
              the Service. You agree not to post content that is illegal,
              offensive, or violates the rights of others.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              5. Contributions and Payments
            </h2>
            <p>
              All financial contributions are processed through third-party
              payment processors. We are not responsible for the processing of
              payments or the management of funds once collected, other than
              providing the tracking tools.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Termination</h2>
            <p>
              We reserve the right to terminate or suspend your account at our
              sole discretion, without notice, for conduct that we believe
              violates these Terms or is harmful to other users, us, or third
              parties, or for any other reason.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
