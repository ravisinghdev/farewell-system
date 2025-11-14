"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 lg:px-24">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-center leading-tight"
      >
        The All-in-One
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563eb] to-[#7c3aed]">
          Farewell Management System
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-center max-w-3xl mx-auto text-slate-300 text-lg"
      >
        A complete futuristic solution for Farewell + Contributions + Chat +
        Events + Gallery + Tasks + Announcements.
      </motion.p>

      <div className="flex justify-center mt-10 gap-4">
        <Button size="lg" className="px-8 text-base shadow-xl">
          Get Started <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="px-8 border-white/20 bg-white/5 text-slate-200"
        >
          Live Demo
        </Button>
      </div>
    </section>
  );
}
