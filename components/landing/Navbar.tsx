"use client";

import React, { JSX, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Search from "@/components/landing/Search";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";

export default function Navbar(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-indigo-600 flex items-center justify-center text-white font-semibold">
            F
          </div>
          <div>
            <div className="text-sm font-semibold">Farewell</div>
            <div className="text-xs text-slate-500">farewell.management</div>
          </div>
        </Link>

        <div className="flex-1">
          <Search />
        </div>

        <nav className="hidden md:flex items-center gap-3">
          <Link href="#features" className="text-sm">
            Features
          </Link>
          <Link href="#screens" className="text-sm">
            Screens
          </Link>
          <Link href="#download" className="text-sm">
            Download
          </Link>
          <Link href="/auth/signin">
            <Button variant="default" size="sm">
              Sign in
            </Button>
          </Link>
        </nav>

        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button aria-label="Open menu" className="p-2 rounded-md">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-3">
                <Link href="#features">Features</Link>
                <Link href="#screens">Screens</Link>
                <Link href="#download">Download</Link>
                <Link href="/auth/signin">Sign in</Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
