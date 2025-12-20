"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function DutyHero() {
  return (
    <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-pink-900/40 border border-white/10 p-8">
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 mb-2"
          >
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400 uppercase tracking-widest">
              Command Center
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70"
          >
            Duty Management
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 mt-2 max-w-lg"
          >
            Organize, track, and complete tasks with your team. Turn work into a
            game and manage budgets effortlessly.
          </motion.p>
        </div>

        {/* Abstract decorative elements */}
        <div className="hidden md:block absolute right-0 top-0 w-64 h-64 bg-blue-500/20 rounded-full filter blur-[80px]" />
        <div className="hidden md:block absolute right-20 bottom-0 w-48 h-48 bg-purple-500/20 rounded-full filter blur-[60px]" />
      </div>
    </div>
  );
}
