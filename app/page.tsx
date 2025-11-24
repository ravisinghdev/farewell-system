import React, { JSX } from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import DownloadSection from "@/components/landing/DownloadSection";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export const metadata = {
  title: "Farewell — Organize Farewells, Collect Contributions",
  description:
    "A complete platform to plan farewells, manage contributions, assign duties and save memories. Built with Next.js and Supabase.",
};

export default function Page(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <DownloadSection />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
