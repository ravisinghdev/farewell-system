"use client";

import { Users, Shield, Star, Rocket } from "lucide-react";
import { JSX } from "react";

function HighlightCard({
  icon,
  title,
  desc,
}: {
  icon: JSX.Element;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
      <div className="text-blue-400 mb-3">{icon}</div>
      <div className="text-lg font-semibold mb-2 text-white">{title}</div>
      <div className="text-slate-300 text-sm">{desc}</div>
    </div>
  );
}

export default function Highlights() {
  return (
    <section className="px-6 lg:px-24 pb-32">
      <h2 className="text-3xl font-bold text-center mb-14">
        Platform Highlights
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <HighlightCard
          icon={<Users />}
          title="User Roles"
          desc="Admin, Organizer, Student, Guest with full permission control."
        />
        <HighlightCard
          icon={<Shield />}
          title="Secure & Realtime"
          desc="Supabase Auth + RLS + Realtime sync across all modules."
        />
        <HighlightCard
          icon={<Star />}
          title="Futuristic UI"
          desc="Neon + glassmorphism + smooth animations everywhere."
        />
        <HighlightCard
          icon={<Rocket />}
          title="Performance"
          desc="Optimized for large events and thousands of participants."
        />
      </div>
    </section>
  );
}
