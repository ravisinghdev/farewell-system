"use client";
import React, { JSX } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const FAQS = [
  {
    q: "How secure is my data?",
    a: "We store data on Supabase with Row Level Security and end-to-end encryption. Payments are processed securely through Razorpay.",
  },
  {
    q: "How do payments work?",
    a: "Payments are processed through Razorpay checkout with full PCI compliance. Contribution pools show live balances and transaction history.",
  },
  {
    q: "Can multiple admins manage a group?",
    a: "Yes — you can have a main admin and additional admins with granular role-based permissions for maximum flexibility.",
  },
  {
    q: "Is the APK safe?",
    a: "Absolutely. The APK is signed and securely hosted in Supabase Storage, served via authenticated signed URLs for maximum security.",
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

export default function FAQ(): JSX.Element {
  return (
    <section id="faq" className="py-20 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-purple-500/30 backdrop-blur-xl mb-6"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">FAQ</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold mb-4"
          >
            <span className="text-gradient animate-gradient">
              Frequently Asked
            </span>
            <br />
            <span className="text-slate-200">Questions</span>
          </motion.h2>
        </div>

        {/* FAQ Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6"
        >
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              variants={item}
              whileHover={{ scale: 1.02, y: -3 }}
              className="group p-6 rounded-xl glass border border-white/10 hover:border-purple-500/30 backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
            >
              <div className="font-semibold text-lg text-white mb-3 group-hover:text-gradient-neon group-hover:bg-clip-text group-hover:text-transparent transition-all">
                {faq.q}
              </div>
              <div className="text-slate-400 text-sm leading-relaxed">
                {faq.a}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
