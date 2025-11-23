"use client";
import React, { JSX } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Hero(): JSX.Element {
  return (
    <section
      id="hero"
      className="py-10 grid lg:grid-cols-2 gap-12 items-center"
    >
      <div>
        <motion.h1
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl font-extrabold"
        >
          Organise farewells. Collect contributions. Celebrate together.
        </motion.h1>
        <motion.p
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-4 text-lg text-slate-600 max-w-xl"
        >
          A complete platform for planning farewells — assign duties, manage
          budgets, chat in real-time, and save memories.
        </motion.p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/auth/signup">
            <Button>Get Started</Button>
          </Link>
          <a href="/api/apk" rel="noopener noreferrer">
            <Button variant="outline">Download APK</Button>
          </a>
        </div>
      </div>

      <div>
        {/* Replace with real image assets */}
        <div className="rounded-md overflow-hidden border">
          <Image
            src="/assets/mockup-dashboard.png"
            alt="dashboard mock"
            width={920}
            height={560}
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
}
