"use client";

import React from "react";
import {
  Wallet,
  Users,
  Image as ImageIcon,
  MessageSquare,
  Calendar,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

export default function Features() {
  return (
    <section
      id="features"
      className="py-32 relative overflow-hidden bg-background"
    >
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute right-0 top-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/50 border border-border/50 mb-6 backdrop-blur-sm">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Features
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Everything You Need
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
              To Say Goodbye perfectly
            </span>
          </h2>
          <p className="text-xl text-muted-foreground font-light">
            Powerful tools wrapped in a stunning interface. Designed to make
            organizing effortless.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
          {/* Main Large Card - Payments */}
          <div className="md:col-span-2 lg:col-span-2 row-span-2 group relative rounded-3xl p-8 bg-card border border-border/50 overflow-hidden hover:border-primary/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform">
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Smart Contributions</h3>
                <p className="text-muted-foreground text-lg">
                  Instant receipts, transparent tracking, and secure Razorpay
                  integration. managing funds has never been this transparent.
                </p>
              </div>

              {/* Visual Mock for Payments */}
              <div className="mt-8 relative h-48 rounded-xl bg-background border border-border/50 overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
                <div className="absolute top-4 left-4 right-4 h-8 bg-accent/50 rounded-md animate-pulse" />
                <div className="absolute top-16 left-4 w-2/3 h-4 bg-muted/50 rounded-md" />
                <div className="absolute top-24 left-4 w-1/2 h-4 bg-muted/30 rounded-md" />

                {/* Floating Success Badge */}
                <div className="absolute top-1/2 right-4 -translate-y-1/2 px-4 py-2 bg-green-500/10 text-green-500 rounded-full text-sm font-bold border border-green-500/20 backdrop-blur-sm">
                  Paid ₹500
                </div>
              </div>
            </div>
          </div>

          {/* Tall Card - Role Management */}
          <div className="md:col-span-1 lg:col-span-1 row-span-2 group relative rounded-3xl p-8 bg-card border border-border/50 overflow-hidden hover:border-purple-500/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 h-full flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-500 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Role Control</h3>
              <p className="text-muted-foreground mb-6">
                Granular permissions for Admins, Treasurers, and Members.
              </p>

              <div className="flex-1 space-y-3">
                {["Admin", "Treasurer", "Editor", "Member"].map((role, i) => (
                  <div
                    key={role}
                    className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 text-sm"
                  >
                    <span>{role}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        i === 0 ? "bg-red-500" : "bg-green-500"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Standard Card - Memories */}
          <div className="md:col-span-1 lg:col-span-1 row-span-1 group relative rounded-3xl p-6 bg-card border border-border/50 overflow-hidden hover:border-pink-500/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-lg font-bold mb-1">Memory Gallery</h3>
              <p className="text-sm text-muted-foreground">
                Unlimited photos & video uploads.
              </p>
            </div>
          </div>

          {/* Standard Card - Chat */}
          <div className="md:col-span-1 lg:col-span-1 row-span-1 group relative rounded-3xl p-6 bg-card border border-border/50 overflow-hidden hover:border-green-500/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-lg font-bold mb-1">Real-time Chat</h3>
              <p className="text-sm text-muted-foreground">
                Built-in group discussions.
              </p>
            </div>
          </div>

          {/* Wide Card - Timeline */}
          <div className="md:col-span-3 lg:col-span-2 row-span-1 group relative rounded-3xl p-8 bg-card border border-border/50 overflow-hidden hover:border-orange-500/50 transition-colors flex flex-col md:flex-row items-center gap-8">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 text-orange-500 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Event Timeline</h3>
              <p className="text-muted-foreground">
                Perfectly timed schedules.
              </p>
            </div>

            {/* Timeline Visual */}
            <div className="relative z-10 flex-1 w-full space-y-3 opacity-60 group-hover:opacity-100 transition-opacity">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full w-1/2 bg-orange-500/50"
                      style={{ width: `${Math.random() * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Card - Security */}
          <div className="md:col-span-3 lg:col-span-2 row-span-1 group relative rounded-3xl p-8 bg-card border border-border/50 overflow-hidden hover:border-cyan-500/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 flex-shrink-0 group-hover:rotate-12 transition-transform">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Bank-Grade Security</h3>
                <p className="text-muted-foreground">
                  Your data is encrypted end-to-end. We prioritize your privacy
                  above all else.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
