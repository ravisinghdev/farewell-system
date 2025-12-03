"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronRight, Search, User } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import SearchDropdown from "./SearchDropdown";
import { useSearch } from "./SearchProvider";
import { createClient } from "@/utils/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSearchOpen, setIsSearchOpen } = useSearch();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    // Check auth state
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Download", href: "#download" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg group-hover:shadow-primary/50 transition-all duration-300 group-hover:scale-105">
                <img
                  src="/images/logo.jpg"
                  alt="Farewell Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                Farewell
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-accent"
              >
                <Search className="w-5 h-5" />
              </button>
              <ThemeToggle />
              <div className="h-6 w-px bg-border" />

              {user ? (
                <Link href="/dashboard">
                  <button className="group relative px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg hover:shadow-primary/25 hover:bg-primary/90 transition-all overflow-hidden">
                    <span className="relative z-10 flex items-center gap-2">
                      Dashboard
                      <User className="w-4 h-4" />
                    </span>
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/auth">
                    <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/auth">
                    <button className="group relative px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg hover:shadow-primary/25 hover:bg-primary/90 transition-all overflow-hidden">
                      <span className="relative z-10 flex items-center gap-2">
                        Get Started
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border p-4 shadow-lg animate-in slide-in-from-top-5">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-base font-medium text-muted-foreground hover:text-primary transition-colors px-2 py-1"
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px bg-border my-2" />

              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <button className="w-full mt-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-base font-medium shadow-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    Go to Dashboard
                    <User className="w-4 h-4" />
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full text-left px-2 py-2 text-base font-medium text-muted-foreground hover:text-foreground transition-colors">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full mt-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-base font-medium shadow-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                      Get Started
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
      <SearchDropdown />
    </>
  );
}
