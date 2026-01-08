"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

interface ImageViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
}

export function ImageViewer({ open, onOpenChange, src, alt }: ImageViewerProps) {
  if (!src) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 bg-transparent border-none overflow-hidden sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>View Image: {alt}</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-[80vh] flex items-center justify-center bg-black/50 rounded-lg overflow-hidden">
          {/* Using classic img tag for simpler handling of unknown proportions fitting in max-h/w */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="object-contain w-full h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
