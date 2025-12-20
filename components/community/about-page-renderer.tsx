"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { AboutPageEditor } from "./about-page-editor";

interface Section {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  order_index: number;
}

interface AboutPageRendererProps {
  sections: Section[];
  farewellId: string;
}

export function AboutPageRenderer({
  sections,
  farewellId,
}: AboutPageRendererProps) {
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell?.role);
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing && isAdmin) {
    return (
      <AboutPageEditor
        farewellId={farewellId}
        initialSections={sections}
        onClose={() => setIsEditing(false)}
      />
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-xl border border-dashed">
        <h3 className="text-xl font-medium text-muted-foreground mb-2">
          About Page Not Configured
        </h3>
        {isAdmin && (
          <Button onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Start Editing
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-20">
      {isAdmin && (
        <div className="flex justify-end sticky top-4 z-10">
          <Button
            onClick={() => setIsEditing(true)}
            size="sm"
            variant="outline"
            className="bg-background shadow-sm"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Page
          </Button>
        </div>
      )}

      {sections.map((section, index) => (
        <div
          key={section.id}
          className={cn(
            "flex flex-col gap-8 items-center",
            index % 2 !== 0 ? "md:flex-row-reverse" : "md:flex-row"
          )}
        >
          {section.image_url && (
            <div className="w-full md:w-1/2">
              <div className="aspect-video relative rounded-xl overflow-hidden shadow-xl bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={section.image_url}
                  alt={section.title}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          )}
          <div
            className={cn(
              "w-full space-y-4",
              section.image_url ? "md:w-1/2" : "text-center max-w-2xl mx-auto"
            )}
          >
            <h2 className="text-3xl font-bold tracking-tight">
              {section.title}
            </h2>
            <div className="prose dark:prose-invert text-muted-foreground whitespace-pre-wrap">
              {section.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
