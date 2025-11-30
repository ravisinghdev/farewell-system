"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Smartphone,
  Globe,
  Sparkles,
  ArrowRight,
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
    <section id="download" className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card border border-border rounded-3xl p-8 md:p-16 text-center shadow-2xl relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Plan the
            <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Ultimate Farewell?
            </span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            Join thousands of students and teachers who are already using our
            platform to organize memorable events.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            {/* Mobile App Card */}
            <div className="group p-6 rounded-2xl bg-background border border-border hover:border-primary/50 transition-all w-full md:w-80 text-left hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Mobile App</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Get the full native experience on your Android device.
              </p>
              <Button
                onClick={handleDownload}
                disabled={loading}
                className="w-full gap-2"
              >
                {loading ? (
                  "Preparing..."
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download APK
                  </>
                )}
              </Button>
            </div>

            {/* Web App Card */}
            <div className="group p-6 rounded-2xl bg-background border border-border hover:border-purple-500/50 transition-all w-full md:w-80 text-left hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 text-purple-500">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Web Platform</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Access from any browser, anywhere, on any device.
              </p>
              <Link href="/auth">
                <Button
                  variant="outline"
                  className="w-full gap-2 group-hover:bg-purple-500/5 group-hover:text-purple-500 group-hover:border-purple-500/20"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-8">
            * APK download is secure and hosted on our private servers.
          </p>
        </div>
      </div>
    </section>
  );
}
