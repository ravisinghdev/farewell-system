"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Users, Heart } from "lucide-react";
import ScreensCarousel from "./ScreensCarousel";

export default function Hero() {
  return (
    <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-primary/5 to-transparent blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border border-border backdrop-blur-sm mb-8 animate-fadeInUp">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">
              The Ultimate Farewell Management Platform
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 animate-fadeInUp [animation-delay:200ms]">
            Organize Farewells
            <br />
            <span className="relative inline-block mt-2">
              <span className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-primary blur-2xl opacity-20" />
              <span className="relative bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-primary animate-gradient">
                Like Never Before
              </span>
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-fadeInUp [animation-delay:400ms]">
            A complete platform to plan events, manage contributions, assign
            duties, and preserve memories. Built for modern schools and
            colleges.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeInUp [animation-delay:600ms]">
            <Link href="/auth" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-lg shadow-lg hover:shadow-primary/25 hover:bg-primary/90 transition-all hover:scale-105 flex items-center justify-center gap-2 group">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="#features" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-background border border-border text-foreground font-semibold text-lg hover:bg-accent hover:border-primary/20 transition-all hover:scale-105">
                Learn More
              </button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex items-center justify-center gap-8 text-muted-foreground animate-fadeInUp [animation-delay:800ms]">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Role Management</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              <span className="text-sm font-medium">Made with Love</span>
            </div>
          </div>
        </div>

        {/* Hero Image / Carousel */}
        <div className="relative mx-auto w-full lg:max-w-6xl animate-fadeInUp [animation-delay:1000ms]">
          <div className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-2xl overflow-hidden aspect-[9/16] sm:aspect-[16/9] group">
            <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent z-10 pointer-events-none" />
            <ScreensCarousel />

            {/* Floating Elements */}
            <div className="absolute -right-12 top-1/4 p-4 z-50 rounded-2xl bg-card border border-border shadow-xl animate-float hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <span className="text-green-500 font-bold">₹</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    New Contribution
                  </p>
                  <p className="text-sm font-bold">₹500.00 received</p>
                </div>
              </div>
            </div>

            <div className="absolute -left-12 bottom-1/4 p-4 rounded-2xl bg-card border border-border shadow-xl animate-float [animation-delay:2000ms] hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">New Member</p>
                  <p className="text-sm font-bold">Alex joined the team</p>
                </div>
              </div>
            </div>
          </div>

          {/* Glow Effect behind image */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary to-purple-500 opacity-10 blur-3xl -z-10 rounded-[3rem]" />
        </div>
      </div>
    </div>
  );
}
