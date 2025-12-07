"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Shield,
  Users,
  Heart,
  ChevronRight,
} from "lucide-react";
import ScreensCarousel from "./ScreensCarousel";

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const { clientX, clientY } = e;
      const moveX = clientX - window.innerWidth / 2;
      const moveY = clientY - window.innerHeight / 2;
      const offsetFactor = 0.05;

      heroRef.current.style.setProperty(
        "--move-x",
        `${moveX * offsetFactor}px`
      );
      heroRef.current.style.setProperty(
        "--move-y",
        `${moveY * offsetFactor}px`
      );
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-40 overflow-hidden min-h-screen flex items-center justify-center">
      {/* Premium Aurora Background */}
      <div className="absolute inset-0 -z-10 bg-background overflow-hidden">
        <div
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[120px] animate-pulse"
          style={{ transform: "translate(var(--move-x), var(--move-y))" }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[100px] animate-pulse delay-1000"
          style={{ transform: "translate(var(--move-x), var(--move-y))" }}
        />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full"
        ref={heroRef}
      >
        <div className="text-center max-w-5xl mx-auto mb-20">
          {/* Premium Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md mb-8 hover:bg-primary/15 transition-colors cursor-default animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              The #1 Farewell Platform
            </span>
          </div>

          {/* Heading with Gradient & tight tracking */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Make Every Goodbye
            <br />
            <span className="relative inline-block mt-2">
              <span className="absolute -inset-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 blur-2xl opacity-30" />
              <span className="relative bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-gradient bg-300%">
                Unforgettable
              </span>
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-light">
            Plan events, collect contributions, and preserve memories in one
            stunning space.
            <span className="text-foreground font-medium">
              {" "}
              No more spreadsheets.
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Link href="/auth" className="w-full sm:w-auto group">
              <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-[0_0_40px_-10px_rgba(var(--primary-rgb),0.5)] hover:shadow-[0_0_60px_-15px_rgba(var(--primary-rgb),0.6)] hover:bg-primary/90 transition-all hover:scale-105 flex items-center justify-center gap-2">
                Start Creating Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="#features" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-background/50 border border-border/50 text-foreground font-semibold text-lg hover:bg-accent/50 hover:border-primary/30 backdrop-blur-sm transition-all hover:scale-105 flex items-center justify-center gap-2">
                See How It Works
              </button>
            </Link>
          </div>
        </div>

        {/* 3D Dashboard Visual */}
        <div className="relative mx-auto w-full max-w-6xl perspective-[2000px] group animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
          {/* Main Container with 3D Rotate */}
          <div
            className="relative rounded-xl border border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-md shadow-2xl transition-transform duration-700 ease-out transform group-hover:rotate-x-2"
            style={{
              transformStyle: "preserve-3d",
              transform: "rotateX(5deg)",
            }}
          >
            <div className="p-2 md:p-4 rounded-xl ring-1 ring-inset ring-white/10">
              <div className="relative rounded-lg overflow-hidden aspect-[16/9] shadow-2xl bg-background">
                <ScreensCarousel />
              </div>
            </div>

            {/* Floating Glass Cards - Now even glassier */}
            <div className="absolute -right-8 top-12 p-4 rounded-2xl bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] animate-float hidden lg:block hover:scale-110 transition-transform cursor-default z-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center ring-2 ring-green-500/30">
                  <span className="text-green-500 font-bold text-xl">₹</span>
                </div>
                <div>
                  <p className="text-xs text-white/60 font-medium uppercase tracking-wider">
                    Just In
                  </p>
                  <p className="text-lg font-bold text-white/90">
                    ₹5,000 received
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -left-8 bottom-24 p-4 rounded-2xl bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] animate-float [animation-delay:2000ms] hidden lg:block hover:scale-110 transition-transform cursor-default z-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center ring-2 ring-blue-500/30">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-white/60 font-medium uppercase tracking-wider">
                    Community
                  </p>
                  <p className="text-lg font-bold text-white/90">+12 Joined</p>
                </div>
              </div>
            </div>
          </div>

          {/* Floor Reflection/Glow */}
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[90%] h-20 bg-primary/20 blur-[100px] rounded-[100%]" />
        </div>

        {/* Trust Strip */}
        <div className="mt-24 pt-8 border-t border-border/40 flex flex-wrap justify-center gap-x-12 gap-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-700">
          <div className="flex items-center gap-3 text-muted-foreground/60 hover:text-primary transition-colors cursor-default">
            <Shield className="w-6 h-6" />
            <span className="font-medium text-lg">Bank-Grade Security</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground/60 hover:text-primary transition-colors cursor-default">
            <Users className="w-6 h-6" />
            <span className="font-medium text-lg">Unlimited Roles</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground/60 hover:text-primary transition-colors cursor-default">
            <Heart className="w-6 h-6" />
            <span className="font-medium text-lg">Memory Preservation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
