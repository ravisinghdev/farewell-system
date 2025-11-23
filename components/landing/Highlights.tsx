"use client";

import React, { JSX, useEffect, useRef } from "react";
import { Users, Shield, Star, Rocket } from "lucide-react";
import { useSearch } from "./SearchProvider";

function HighlightCard({
  id,
  icon,
  title,
  desc,
}: {
  id: string;
  icon: JSX.Element;
  title: string;
  desc: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const { register, unregister, query } = useSearch();

  useEffect(() => {
    register({ id, title, description: desc, type: "highlight", ref });
    return () => unregister(id);
  }, [id, title, desc, register, unregister]);

  const q = (query ?? "").toString().trim().toLowerCase();
  const visible =
    !q || title.toLowerCase().includes(q) || desc.toLowerCase().includes(q);

  return (
    <div
      ref={ref as any}
      tabIndex={-1}
      className={`p-6 rounded-2xl border ${
        !visible ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div className="text-primary mb-3">{icon}</div>
      <div className="text-lg font-semibold mb-2">{title}</div>
      <div className="text-sm text-muted-foreground">{desc}</div>
    </div>
  );
}

export default function Highlights() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 pb-16">
      <h2 className="text-2xl font-bold text-center mb-8">
        Platform Highlights
      </h2>

      <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <HighlightCard
          id="h-roles"
          icon={<Users />}
          title="User Roles"
          desc="Admin, Organizer, Student with granular RLS permissions."
        />
        <HighlightCard
          id="h-sec"
          icon={<Shield />}
          title="Secure & Realtime"
          desc="Supabase Auth + RLS + Live sync everywhere."
        />
        <HighlightCard
          id="h-ui"
          icon={<Star />}
          title="Futuristic UI"
          desc="Neon, glass, gradients, animations across all pages."
        />
        <HighlightCard
          id="h-performance"
          icon={<Rocket />}
          title="High Performance"
          desc="Optimized for large events & heavy chat usage."
        />
      </div>
    </section>
  );
}
