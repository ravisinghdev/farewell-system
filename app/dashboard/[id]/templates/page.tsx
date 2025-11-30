"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Download, LayoutTemplate } from "lucide-react";

export default function TemplatesPage() {
  return (
    <PageScaffold
      title="Templates & Designs"
      description="Downloadable assets for social media and print."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="group relative rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden"
          >
            <div className="aspect-[4/5] bg-muted flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <LayoutTemplate className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <div className="p-4">
              <h3 className="font-semibold">Instagram Story Template {i}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                1080x1920px • PNG
              </p>
              <Button variant="secondary" size="sm" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>
    </PageScaffold>
  );
}
