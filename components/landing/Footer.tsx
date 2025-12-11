"use client";

import React from "react";
import Link from "next/link";
import {
  Github,
  Twitter,
  Linkedin,
  Heart,
  Mail,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-20 pb-10 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-20">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <Logo
                size="md"
                className="shadow-lg group-hover:scale-110 transition-transform duration-300"
              />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                Farewell
              </span>
            </Link>
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-sm">
              The modern way to organize school farewells. Collect
              contributions, assign tasks, and preserve memories forever.
            </p>
            <div className="flex items-center gap-4">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <Link
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all hover:scale-110"
                >
                  <Icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-2">
            <h4 className="font-bold mb-6 text-foreground">Product</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              {["Features", "How it Works", "Pricing", "Testimonials"].map(
                (link) => (
                  <li key={link}>
                    <Link
                      href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                      className="hover:text-primary transition-colors flex items-center gap-2 group"
                    >
                      {link}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-bold mb-6 text-foreground">Legal</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                (link) => (
                  <li key={link}>
                    <Link
                      href={`/${link.split(" ")[0].toLowerCase()}`}
                      className="hover:text-primary transition-colors flex items-center gap-2 group"
                    >
                      {link}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-4">
            <h4 className="font-bold mb-6 text-foreground">Stay Updated</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Get the latest updates on new features and themes.
            </p>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Enter your email"
                  className="pl-10 h-12 bg-accent/30 border-border/50 focus:bg-background transition-colors rounded-xl"
                />
              </div>
              <Button className="h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Farewell System. All rights reserved.
          </p>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Designed with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
            <span>by Farewell Team</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
