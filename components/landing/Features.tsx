"use client";
import React, { JSX } from "react";
import { motion } from "framer-motion";
import {
  Coins,
  ClipboardCheck,
  MessageSquare,
  Image as ImageIcon,
  Shield,
  Smartphone,
  Sparkles,
} from "lucide-react";

type Feature = {
  id: string;
  title: string;
  desc: string;
  icon: JSX.Element;
  gradient: string;
};

const FEATURES: Feature[] = [
  {
    id: "contribution",
    title: "Contribution Management",
    desc: "Create pools, set targets and integrate Razorpay for seamless payments.",
    icon: <Coins className="w-8 h-8" />,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "duties",
    title: "Duty & Reimbursements",
    desc: "Assign duties, upload receipts and approve reimbursements with ease.",
    icon: <ClipboardCheck className="w-8 h-8" />,
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    id: "chat",
    title: "Real-time Chat",
    desc: "Channels, mentions, media sharing and end-to-end encryption.",
    icon: <MessageSquare className="w-8 h-8" />,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: "gallery",
    title: "Gallery & Memories",
    desc: "Upload photos, create albums and preserve memories forever.",
    icon: <ImageIcon className="w-8 h-8" />,
    gradient: "from-orange-500 to-yellow-500",
  },
  {
    id: "roles",
    title: "Roles & Permissions",
    desc: "Granular admin and member roles with advanced permission controls.",
    icon: <Shield className="w-8 h-8" />,
    gradient: "from-violet-500 to-purple-500",
  },
  {
    id: "multi",
    title: "Multi-platform",
    desc: "Seamless experience across Web and Mobile with APK download.",
    icon: <Smartphone className="w-8 h-8" />,
    gradient: "from-pink-500 to-rose-500",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Features(): JSX.Element {
  return (
    <section id="features" className="py-20 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-purple-500/30 backdrop-blur-xl mb-6"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">
              Features
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold mb-4"
          >
            <span className="text-gradient-cyber animate-gradient">
              Packed Features
            </span>
            <br />
            <span className="text-slate-200">for Every Farewell</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400"
          >
            From financial transparency to real-time collaboration and memory
            galleries
          </motion.p>
        </div>

        {/* Features Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.id}
              variants={item}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group relative p-8 rounded-2xl glass border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20"
            >
              {/* Gradient Glow on Hover */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300`}
              ></div>

              {/* Icon */}
              <div
                className={`relative inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.gradient} shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <div className="text-white">{feature.icon}</div>
              </div>

              {/* Content */}
              <div className="relative">
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 transition-all">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>

              {/* Hover Border Effect */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-20 pointer-events-none transition-opacity duration-300`}
              ></div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
