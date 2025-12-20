"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import Link from "next/link";

// Categorized Data
const faqCategories = [
  {
    id: "general",
    label: "General",
    items: [
      {
        question: "What exactly is this platform?",
        answer:
          "It's an all-in-one timeline and contribution management tool designed specifically for school and college farewells. It replaces spreadsheets, manual cash collection, and scattered WhatsApp groups.",
      },
      {
        question: "Is it free to use?",
        answer:
          "Yes, the core features for organizing farewells are completely free for students. We want to help you make memories, not profits.",
      },
    ],
  },
  {
    id: "payments",
    label: "Payments & Security",
    items: [
      {
        question: "How secure is the money?",
        answer:
          "Extremely. We use Razorpay for payments, meaning we never store card details. All transactions are logged in real-time, so everyone can see exactly how much has been collected.",
      },
      {
        question: "Can I track who hasn't paid?",
        answer:
          "Yes! The admin dashboard shows a clear list of paid vs. unpaid members, and you can send reminders directly.",
      },
    ],
  },
  {
    id: "features",
    label: "Features & Tech",
    items: [
      {
        question: "How does the 'Digital Yearbook' work?",
        answer:
          "Students can upload photos and write messages for each other. The system automatically compiles these into a beautiful, browsable gallery that serves as a permanent digital memory.",
      },
      {
        question: "Is there a mobile app?",
        answer:
          "Yes! We offer a smooth Android app (APK) for the best experience, alongside this fully responsive web dashboard.",
      },
    ],
  },
];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState("general");

  return (
    <section id="faq" className="py-24 relative bg-background overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute -left-20 top-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute -right-20 bottom-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge
            variant="outline"
            className="mb-4 px-4 py-1 border-primary/20 bg-primary/5 text-primary"
          >
            Support
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about the product and billing. Can’t
            find the answer you’re looking for? Please chat to our friendly
            team.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {faqCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 cursor-pointer py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                  : "bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Questions Accordion */}
        <div className="bg-card/50 cursor-pointer backdrop-blur-sm border border-border/50 rounded-3xl p-2 sm:p-8 shadow-xl">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqCategories
              .find((c) => c.id === activeCategory)
              ?.items.map((faq, index) => (
                <div
                  key={index}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                  <AccordionItem
                    value={`item-${index}`}
                    className="border border-border/50 rounded-xl px-4 sm:px-6 bg-background/50 data-[state=open]:bg-accent/30 data-[state=open]:border-primary/20 transition-all duration-300"
                  >
                    <AccordionTrigger className="cursor-pointer text-left font-medium text-lg py-5 hover:no-underline hover:text-primary transition-colors">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground cursor-pointer pb-6 leading-relaxed text-base">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </div>
              ))}
          </Accordion>
        </div>

        {/* Still have questions CTA */}
        <div className="mt-12 text-center p-8 rounded-3xl bg-accent/30 border border-border/50">
          <h4 className="text-xl font-semibold mb-2">Still have questions?</h4>
          <p className="text-muted-foreground mb-6">
            Can't find the answer you're looking for?
          </p>
          <Link href="/contact">
            <button className="px-6 py-3 cursor-pointer rounded-full bg-foreground text-background font-medium hover:opacity-90 transition-opacity">
              Contact Support
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
