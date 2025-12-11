"use client";

import React, { useActionState, useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitContactForm } from "@/app/actions/contact";
import { toast } from "sonner";
import { Mail, MapPin, Phone, Send, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const initialState = {
  message: "",
  error: "",
  success: false,
};

export default function ContactPage() {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      const form = document.getElementById("contact-form") as HTMLFormElement;
      if (form) form.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: "support@farewell.app",
      description: "Our friendly team is here to help.",
    },
    {
      icon: Phone,
      title: "Phone",
      value: "+91 98765 43210",
      description: "Mon-Fri from 8am to 5pm.",
    },
    {
      icon: MapPin,
      title: "Office",
      value: "Tech Park, Bangalore",
      description: "Come say hello at our office HQ.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 border-b border-border/50 overflow-hidden">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              Contact our team
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Got any questions about the Farewell System or need help
              organizing your event? We're here to help. Chat to our friendly
              team 24/7.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left Column: Form */}
            <div className="order-2 lg:order-1">
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-8">
                  <form
                    id="contact-form"
                    action={formAction}
                    className="space-y-6"
                  >
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">First name</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="John"
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="john@example.com"
                          className="h-11"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="What is this regarding?"
                        className="h-11"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Leave us a message..."
                        className="min-h-[200px] resize-y"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-medium transition-all"
                      disabled={isPending}
                    >
                      {isPending ? (
                        "Sending message..."
                      ) : (
                        <>
                          Send message <Send className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Info & Map Placeholder */}
            <div className="order-1 lg:order-2 space-y-12">
              <div className="grid gap-8">
                {contactInfo.map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-accent/50 text-foreground">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className="mt-1 text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="mt-2 font-medium text-primary hover:underline cursor-pointer">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Optional Map or Abstract Visual */}
              <div className="aspect-video w-full rounded-2xl border border-border/50 bg-secondary/20 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#808080_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="text-center p-6">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Headquarters
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Bangalore, India
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
