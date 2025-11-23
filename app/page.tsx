
import React, { JSX } from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import DeepSections from "@/components/landing/DeepSection";
import ScreensCarousel from "@/components/landing/ScreensCarousel";
import DownloadSection from "@/components/landing/DownloadSection";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export const metadata = {
  title: "Farewell — Organise Farewells, Collect Contributions",
  description:
    "A complete platform to plan farewells, manage contributions, assign duties and save memories.",
};

export default function Page(): JSX.Element {
  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Hero />
        <Features />
        <DeepSections />
        <ScreensCarousel />
        <DownloadSection />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
