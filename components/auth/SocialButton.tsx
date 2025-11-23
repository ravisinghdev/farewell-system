// components/auth/SocialButtons.tsx
"use client";
import React from "react";
import { Button } from "@/components/ui/button";

export default function SocialButtons({ onGoogle }: { onGoogle?: () => void }) {
  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full flex items-center justify-center gap-3 text-lg font-semibold text-white border border-neutral-700 bg-transparent hover:bg-linear-to-r hover:from-violet-500 hover:to-cyan-500 hover:text-white focus:outline-none transition"
        onClick={onGoogle}
      >
        Continue with Google
      </Button>
    </div>
  );
}
