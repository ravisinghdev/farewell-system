"use client";
import React, { JSX } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles, Zap, Download } from "lucide-react";

export default function Hero(): JSX.Element {
  return (
    <section id="hero" className="relative py-20 md:py-32 overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-purple-500/30 backdrop-blur-xl"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">
              Next-Gen Farewell Management
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold leading-tight"
          >
            <span className="text-gradient-cyber animate-gradient">
              Organize Farewells.
            </span>
            <br />
            <span className="text-gradient-neon animate-gradient">
              Create Memories.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 dark:text-slate-400 max-w-xl leading-relaxed"
          >
            A powerful platform for planning farewells — manage contributions,
            assign duties, chat in real-time, and preserve precious memories
            forever.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Free
                  <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
              </Button>
            </Link>
            <a href="/api/apk" rel="noopener noreferrer">
              <Button
                size="lg"
                variant="outline"
                className="group glass-strong border-2 border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-cyan-200 px-8 py-6 text-lg font-semibold rounded-xl backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/30"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                  Download APK
                </span>
              </Button>
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap gap-8 pt-4"
          >
            <div className="space-y-1">
              <div className="text-3xl font-bold text-gradient-neon">10K+</div>
              <div className="text-sm text-slate-400">Active Users</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-gradient-cyber">50K+</div>
              <div className="text-sm text-slate-400">Farewells Organized</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-gradient">99.9%</div>
              <div className="text-sm text-slate-400">Satisfaction Rate</div>
            </div>
          </motion.div>
        </div>

        {/* Right Content - 3D Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          {/* Glow Effect Behind */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 blur-3xl opacity-30 animate-glow-pulse"></div>

          {/* Mockup Container */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 backdrop-blur-sm glass transform hover:scale-105 transition-transform duration-500">
            <Image
              src="/assets/mockup-dashboard.png"
              alt="Futuristic Dashboard Interface"
              width={920}
              height={560}
              className="w-full h-auto"
              priority
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 via-transparent to-cyan-900/30 pointer-events-none"></div>
          </div>

          {/* Floating UI Elements */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-6 -right-6 px-6 py-3 rounded-xl glass-strong border border-cyan-500/50 shadow-lg shadow-cyan-500/30"
          >
            <div className="text-sm font-medium text-cyan-300">
              🚀 Real-time Updates
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute -bottom-6 -left-6 px-6 py-3 rounded-xl glass-strong border border-purple-500/50 shadow-lg shadow-purple-500/30"
          >
            <div className="text-sm font-medium text-purple-300">
              ✨ AI-Powered Features
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
