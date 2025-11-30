"use client";

import React from "react";
import { motion } from "framer-motion";

const STATS = [
  { label: "Active Users", value: "2,000+", suffix: "Students" },
  { label: "Farewells Organized", value: "50+", suffix: "Events" },
  { label: "Memories Saved", value: "15k+", suffix: "Photos" },
  { label: "Contributions", value: "₹5L+", suffix: "Processed" },
];

export default function Stats() {
  return (
    <section className="py-20 border-y border-border bg-accent/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50 mb-2">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
