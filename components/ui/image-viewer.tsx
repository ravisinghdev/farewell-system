"use client";

import { X, ZoomIn, ZoomOut, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";

interface ImageViewerProps {
  src: string;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageViewer({ src, alt, open, onOpenChange }: ImageViewerProps) {
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => setScale((p) => Math.min(p + 0.5, 3));
  const handleZoomOut = () => setScale((p) => Math.max(p - 0.5, 1));

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none flex flex-col items-center justify-center overflow-hidden">
        {/* Controls */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={handleZoomOut}
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={handleZoomIn}
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
          <a
            href={src}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 text-white/70 hover:text-white hover:bg-white/10"
          >
            <Download className="w-5 h-5" />
          </a>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </Button>
          </DialogClose>
        </div>

        {/* Image Area */}
        <div className="flex-1 w-full flex items-center justify-center overflow-auto p-4 cursor-move">
          <div
            className="relative transition-transform duration-200 ease-out"
            style={{ transform: `scale(${scale})` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl"
              draggable={false}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
