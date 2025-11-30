"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Plus, Palette } from "lucide-react";

export default function DecorPage() {
  return (
    <PageScaffold
      title="Decoration & Setup"
      description="Plan venue decoration, themes, and layout."
      action={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Decor Item
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-primary" />
            Theme Selection
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/20 flex items-center justify-between">
              <div>
                <p className="font-medium">Hollywood Glamour</p>
                <p className="text-sm text-muted-foreground">
                  Red carpet, gold accents
                </p>
              </div>
              <div className="h-4 w-4 rounded-full border-2 border-primary bg-primary" />
            </div>
            <div className="p-4 rounded-lg border bg-muted/20 flex items-center justify-between opacity-60">
              <div>
                <p className="font-medium">Enchanted Forest</p>
                <p className="text-sm text-muted-foreground">
                  Greenery, fairy lights
                </p>
              </div>
              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">Mood Board</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="aspect-square rounded-md bg-muted animate-pulse" />
            <div className="aspect-square rounded-md bg-muted animate-pulse" />
            <div className="aspect-square rounded-md bg-muted animate-pulse" />
            <div className="aspect-square rounded-md bg-muted animate-pulse" />
          </div>
          <p className="text-xs text-center text-muted-foreground mt-4">
            Upload images to create a mood board
          </p>
        </div>
      </div>
    </PageScaffold>
  );
}
