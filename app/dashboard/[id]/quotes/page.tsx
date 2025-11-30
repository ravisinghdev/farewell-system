"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Plus, Quote } from "lucide-react";

export default function QuotesPage() {
  return (
    <PageScaffold
      title="Best Quotes & Memories"
      description="A collection of memorable quotes and moments."
      action={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Quote
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm relative">
          <Quote className="absolute top-4 left-4 h-8 w-8 text-primary/10 rotate-180" />
          <blockquote className="mt-4 text-lg italic font-medium text-center">
            "The future belongs to those who believe in the beauty of their
            dreams."
          </blockquote>
          <div className="mt-4 text-center">
            <p className="text-sm font-semibold">Eleanor Roosevelt</p>
            <p className="text-xs text-muted-foreground">
              Submitted by Sarah J.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm relative">
          <Quote className="absolute top-4 left-4 h-8 w-8 text-primary/10 rotate-180" />
          <blockquote className="mt-4 text-lg italic font-medium text-center">
            "Don't cry because it's over, smile because it happened."
          </blockquote>
          <div className="mt-4 text-center">
            <p className="text-sm font-semibold">Dr. Seuss</p>
            <p className="text-xs text-muted-foreground">
              Submitted by Class 12B
            </p>
          </div>
        </div>
      </div>
    </PageScaffold>
  );
}
