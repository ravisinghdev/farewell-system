import React, { JSX } from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Stats from "@/components/landing/Stats";
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
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <DownloadSection />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
