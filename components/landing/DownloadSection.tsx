"use client";
import React, { JSX, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Download, Smartphone, Globe, Sparkles } from "lucide-react";

export default function DownloadSection(): JSX.Element {
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
    <section id="download" className="py-20 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/30 to-cyan-500/30 rounded-full blur-3xl animate-glow-pulse"></div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-purple-500/30 backdrop-blur-xl mb-6"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">
              Download
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold mb-4"
          >
            <span className="text-gradient-neon animate-gradient">
              Get the App
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400"
          >
            Download the Android APK directly or continue on the web
          </motion.p>
        </div>

        {/* Download Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Mobile Download Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="group relative p-8 rounded-2xl glass-strong border border-purple-500/30 hover:border-purple-500/50 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity"></div>

            <div className="relative">
              <div className="inline-flex p-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg mb-6">
                <Smartphone className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">Mobile App</h3>
              <p className="text-slate-400 mb-6">
                Download the Android APK for the full native experience
              </p>

              <Button
                onClick={handleDownload}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 text-white shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                size="lg"
              >
                {loading ? (
                  "Preparing…"
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Download APK
                  </>
                )}
              </Button>
            </div>
          </motion.div>

          {/* Web App Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="group relative p-8 rounded-2xl glass-strong border border-cyan-500/30 hover:border-cyan-500/50 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/30"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-10 blur-xl transition-opacity"></div>

            <div className="relative">
              <div className="inline-flex p-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 shadow-lg mb-6">
                <Globe className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">Web App</h3>
              <p className="text-slate-400 mb-6">
                Access from any browser, anywhere, on any device
              </p>

              <Button
                asChild
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 border-0 text-white shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
                size="lg"
              >
                <a href="/auth/signup">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Started
                </a>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-xs text-center text-slate-500 mt-8"
        >
          Note: APK is served via a short-lived signed URL from Supabase Storage
        </motion.p>
      </div>
    </section>
  );
}
