"use client";

import React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Navbar({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (v: string) => void;
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-xl bg-[#0b0e1a]/70">
      <div className="flex items-center justify-between h-16 px-6 lg:px-24">
        <Link href="/" className="text-xl font-bold text-slate-100">
          FarewellOS
        </Link>

        <div className="hidden md:block relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search features..."
            value={query}
            onChange={(e) => setQuery(e.target.value ?? "")}
            className="pl-10 bg-white/5 border-white/10 text-slate-200"
          />
        </div>

        <div className="flex gap-4 items-center">
          <Button
            variant="ghost"
            className="hover:bg-white/10 text-slate-200 text-sm"
          >
            Login
          </Button>
          <Button className="text-sm px-5">Register</Button>
        </div>
      </div>
    </div>
  );
}
