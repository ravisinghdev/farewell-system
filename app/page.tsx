"use client";

import React, { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import FeatureSearch from "@/components/landing/FeatureSearch";
import Highlights from "@/components/landing/Highlights";
import FooterSection from "@/components/landing/Footer";

export default function LandingPage() {
  const [query, setQuery] = useState<string>("");

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b0e1a] via-[#0a0c14] to-[#05060a] text-slate-100 antialiased">
      <Navbar query={query} setQuery={setQuery} />
      <Hero />
      <FeatureSearch query={query} setQuery={setQuery} />
      <Highlights />
      <FooterSection />
    </main>
  );
}
