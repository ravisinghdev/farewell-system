"use client";

import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function FeatureSearch({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (v: string) => void;
}) {
  const features = [
    "Real-time Chat System (Instagram-style DMs, Groups, Class-Year Auto Join)",
    "Advanced Contributions Engine (UPI, Razorpay, Offline Requests)",
    "Event Management with Milestones & Tasks",
    "Gallery & Media Library with Uploads and Highlights",
    "Announcements with Scheduling and Read Receipts",
    "Complaint System with Chat-Level Escalation",
    "User Roles + Permissions + RLS Protection",
    "Dashboard with Analytics, Insights, and Reports",
    "Slambook, Posts, QR Entry, AI Moderation, and More",
  ];

  const q = (query ?? "").toLowerCase();
  const filtered = features.filter((f) => f.toLowerCase().includes(q));

  return (
    <section className="px-6 lg:px-24 pb-20">
      <div className="max-w-3xl mx-auto mb-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search features..."
            value={query}
            onChange={(e) => setQuery(e.target.value ?? "")}
            className="pl-12 py-6 bg-white/5 border-white/10 text-slate-200 text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all backdrop-blur-lg">
              <CardContent className="p-6 text-base text-slate-200 font-medium">
                <Sparkles className="h-5 w-5 text-blue-400 inline-block mr-2" />{" "}
                {f}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
