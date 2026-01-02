"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

export function ShareButton() {
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied to clipboard");
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleShare}
      className="bg-card rounded-xl h-10 border-border text-foreground shadow-sm flex-1 md:flex-none"
    >
      <Share2 className="w-4 h-4 mr-2" /> Share
    </Button>
  );
}




