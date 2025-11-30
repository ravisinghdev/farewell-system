"use client";

import React from "react";
import {
  Wallet,
  Users,
  Image as ImageIcon,
  MessageSquare,
  Calendar,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    title: "Smart Contributions",
    description:
      "Collect payments securely with Razorpay integration. Track who paid and generate instant receipts.",
    icon: Wallet,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Role Management",
    description:
      "Assign roles like Admin, Treasurer, and Member. Control access permissions effortlessly.",
    icon: Users,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    title: "Memory Gallery",
    description:
      "Upload and organize photos and videos. Create a digital yearbook to cherish forever.",
    icon: ImageIcon,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    title: "Real-time Chat",
    description:
      "Discuss plans, share ideas, and stay updated with built-in group chat and announcements.",
    icon: MessageSquare,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    title: "Event Timeline",
    description:
      "Plan the event schedule minute-by-minute. Ensure everything runs smoothly on the big day.",
    icon: Calendar,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    title: "Secure & Private",
    description:
      "Your data is encrypted and secure. Only approved members can access the dashboard.",
    icon: ShieldCheck,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Everything You Need to Plan the
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 ml-2">
              Perfect Farewell
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed to take the stress out of planning, so
            you can focus on making memories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-8 rounded-3xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Gradient */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
