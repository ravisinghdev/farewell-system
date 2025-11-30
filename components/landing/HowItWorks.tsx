"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  UserPlus,
  Wallet,
  Image as ImageIcon,
  PartyPopper,
} from "lucide-react";

const STEPS = [
  {
    icon: UserPlus,
    title: "Create & Invite",
    description:
      "Start a farewell group and invite your classmates and teachers via a simple link.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Wallet,
    title: "Collect Contributions",
    description:
      "Pool funds securely for the event. Track payments and manage the budget transparently.",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    icon: ImageIcon,
    title: "Share Memories",
    description:
      "Upload photos, videos, and write heartfelt messages to the digital yearbook.",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    icon: PartyPopper,
    title: "Celebrate",
    description:
      "Enjoy the event with organized timelines, games, and a lifetime of memories saved.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Organizing a farewell has never been easier. Just follow these
            simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -z-10" />

          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative bg-background pt-8"
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-24 h-24 rounded-2xl ${step.bg} flex items-center justify-center mb-6 shadow-sm border border-border/50`}
                >
                  <step.icon className={`w-10 h-10 ${step.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
