"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How secure is my data?",
    answer:
      "We store data on Supabase with Row Level Security and end-to-end encryption. Payments are processed securely through Razorpay, ensuring your financial information is never stored on our servers.",
  },
  {
    question: "How do payments work?",
    answer:
      "Payments are processed through Razorpay checkout with full PCI compliance. Contribution pools show live balances and transaction history, so you can track every rupee collected.",
  },
  {
    question: "Can multiple admins manage a group?",
    answer:
      "Yes! You can have a main admin and additional admins with granular role-based permissions. This allows you to delegate tasks like finance management or content moderation.",
  },
  {
    question: "Is the APK safe to install?",
    answer:
      "Absolutely. The APK is signed and securely hosted in Supabase Storage. We serve it via authenticated signed URLs for maximum security. It provides the best mobile experience.",
  },
  {
    question: "Is it free to use?",
    answer:
      "Yes, the core features for organizing farewells are completely free for students. We may introduce premium themes or storage options in the future.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-24 bg-accent/5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Have questions? We're here to help.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border rounded-xl px-6 bg-card"
            >
              <AccordionTrigger className="text-left font-medium text-lg py-6 hover:no-underline hover:text-primary transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
