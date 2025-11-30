"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Play, Upload } from "lucide-react";

export default function FarewellVideoPage() {
  return (
    <PageScaffold
      title="Farewell Film"
      description="The official farewell movie and video clips."
      action={
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Clip
        </Button>
      }
    >
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="w-full max-w-3xl aspect-video bg-black rounded-xl flex items-center justify-center relative group cursor-pointer overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
          <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform z-10">
            <Play className="h-8 w-8 text-white fill-white ml-1" />
          </div>
          <div className="absolute bottom-6 left-6 text-white z-10">
            <h3 className="text-2xl font-bold">Farewell 2024: The Movie</h3>
            <p className="text-white/80">Coming Soon • Trailer Available</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-video bg-muted rounded-lg relative group cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageScaffold>
  );
}
