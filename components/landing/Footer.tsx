import React, { JSX } from "react";
import Link from "next/link";

export default function Footer(): JSX.Element {
  return (
    <footer className="border-t border-white/10 glass-strong backdrop-blur-2xl mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo and Tagline */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/50">
              F
            </div>
            <div>
              <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                Farewell
              </div>
              <div className="text-xs text-slate-500">
                organise · collect · celebrate
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href="/privacy"
              className="text-slate-400 hover:text-purple-400 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/auth"
              className="text-slate-400 hover:text-pink-400 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth"
              className="text-slate-400 hover:text-purple-400 transition-colors"
            >
              Sign Up
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} Farewell. All rights reserved.
          </div>
        </div>

        {/* Divider */}
        <div className="mt-8 pt-8 border-t border-white/10 text-center">
          <p className="text-xs text-slate-500">
            Built with Next.js, Supabase, and ❤️
          </p>
        </div>
      </div>
    </footer>
  );
}
