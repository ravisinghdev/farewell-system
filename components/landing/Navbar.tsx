"use client";

import React, { JSX, useState } from "react";
import Link from "next/link";
import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Search from "@/components/landing/Search";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";

export default function Navbar(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 glass-strong backdrop-blur-2xl shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/80 transition-all duration-300 group-hover:scale-110">
            <span className="relative z-10">F</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-400 to-cyan-400 opacity-0 group-hover:opacity-50 blur-md transition-opacity"></div>
          </div>
          <div className="hidden sm:block">
            <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
              Farewell
            </div>
            <div className="text-xs text-slate-400">farewell.management</div>
          </div>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <Search />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          <Link
            href="#features"
            className="text-sm font-medium text-slate-300 hover:text-purple-400 transition-colors duration-200"
          >
            Features
          </Link>
          <Link
            href="#screens"
            className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors duration-200"
          >
            Screens
          </Link>
          <Link
            href="#download"
            className="text-sm font-medium text-slate-300 hover:text-pink-400 transition-colors duration-200"
          >
            Download
          </Link>
          <Link href="/auth/signin">
            <Button
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 text-white shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu */}
        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className="p-2 rounded-lg glass border border-purple-500/30 hover:border-purple-500/60 transition-colors"
              >
                <Menu className="w-6 h-6 text-purple-400" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 glass-strong border-l border-purple-500/30 backdrop-blur-2xl"
            >
              <div className="flex flex-col gap-6 mt-8">
                <Link
                  href="#features"
                  onClick={() => setOpen(false)}
                  className="text-lg font-medium text-slate-300 hover:text-purple-400 transition-colors px-4 py-2 rounded-lg hover:bg-purple-500/10"
                >
                  Features
                </Link>
                <Link
                  href="#screens"
                  onClick={() => setOpen(false)}
                  className="text-lg font-medium text-slate-300 hover:text-cyan-400 transition-colors px-4 py-2 rounded-lg hover:bg-cyan-500/10"
                >
                  Screens
                </Link>
                <Link
                  href="#download"
                  onClick={() => setOpen(false)}
                  className="text-lg font-medium text-slate-300 hover:text-pink-400 transition-colors px-4 py-2 rounded-lg hover:bg-pink-500/10"
                >
                  Download
                </Link>
                <Link
                  href="/auth/signin"
                  onClick={() => setOpen(false)}
                  className="mt-4"
                >
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 text-white shadow-lg"
                    size="lg"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
