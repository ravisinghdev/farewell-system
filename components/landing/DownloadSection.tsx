"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Smartphone,
  Globe,
  ArrowRight,
  Monitor,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default function DownloadSection() {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch("/api/apk");
      if (!res.ok) throw new Error("Failed to get download link");
      const data = await res.json();
      const url = data?.url;
      if (!url) throw new Error("No URL returned");

      const a = document.createElement("a");
      a.href = url;
      a.download = "farewell-app.apk";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Download failed. Check console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="download"
      className="py-24 relative overflow-hidden bg-background"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-primary/10 rounded-full blur-[120px] opacity-70" />
        <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-[0.02]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] bg-card/50 border border-white/10 overflow-hidden backdrop-blur-3xl shadow-2xl p-8 lg:p-16">
          {/* Inner Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
            {/* Text Side */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight leading-tight">
                Your Farewell, <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
                  Anywhere You Go.
                </span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed font-light">
                Seamlessly switch between our native Android app and the
                powerful web dashboard. Your data stays perfectly synced.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  onClick={handleDownload}
                  disabled={loading}
                  className="h-14 px-8 rounded-full text-lg shadow-lg hover:shadow-primary/25 bg-primary text-primary-foreground hover:scale-105 transition-all w-full sm:w-auto"
                >
                  {loading ? (
                    "Starting..."
                  ) : (
                    <span className="flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Download Android App
                    </span>
                  )}
                </Button>
                <Link href="/auth" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="h-14 px-8 rounded-full text-lg border-border bg-background/50 hover:bg-accent hover:border-primary/30 w-full sm:w-auto"
                  >
                    <span className="flex items-center gap-2">
                      Open Web Dashboard
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Real-time Sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Offline Support</span>
                </div>
              </div>
            </div>

            {/* Visual Side */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none relative perspective-1000">
              {/* Floating Elements Animation Container */}
              <div className="relative w-full aspect-square flex items-center justify-center">
                {/* Circle Backgrounds */}
                <div className="absolute w-[400px] h-[400px] border border-primary/20 rounded-full animate-[spin_60s_linear_infinite]" />
                <div className="absolute w-[550px] h-[550px] border border-dashed border-primary/10 rounded-full animate-[spin_40s_linear_infinite_reverse]" />

                {/* App Card */}
                <div className="absolute hover:z-20 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 left-[10%] top-[20%] p-6 rounded-3xl bg-background/80 backdrop-blur-xl border border-border shadow-xl w-64">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-4 text-white shadow-lg">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Android App</h3>
                  <p className="text-xs text-muted-foreground">
                    Native performance, push notifications.
                  </p>
                </div>

                {/* Web Card */}
                <div className="absolute hover:z-20 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 right-[10%] bottom-[20%] p-6 rounded-3xl bg-background/80 backdrop-blur-xl border border-border shadow-xl w-64">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-4 text-white shadow-lg">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Web Dashboard</h3>
                  <p className="text-xs text-muted-foreground">
                    Admin controls, analytics, large screen view.
                  </p>
                </div>

                {/* Center Connector */}
                <div className="absolute w-40 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent rotate-45 blur-[1px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
