"use client";

import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ConstructionPlaceholderProps {
  title?: string;
  description?: string;
  backLink?: string;
}

export function ConstructionPlaceholder({
  title = "Under Construction",
  description = "We're working hard to bring you this feature. Stay tuned!",
  backLink,
}: ConstructionPlaceholderProps) {
  const router = useRouter();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="bg-primary/10 p-6 rounded-full mb-6">
        <Construction className="w-16 h-16 text-primary" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        {title}
      </h2>
      <p className="text-muted-foreground max-w-md text-lg mb-8">
        {description}
      </p>
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => (backLink ? router.push(backLink) : router.back())}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
}
