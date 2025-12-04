"use client";

import { Heart } from "lucide-react";

interface AboutStatsProps {
  stats: {
    membersCount: number;
    memoriesCount: number;
    funLevel: string;
  };
}

export function AboutStats({ stats }: AboutStatsProps) {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-8">
      <div className="flex justify-center">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <Heart className="h-10 w-10 text-primary fill-primary" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Made with Love</h2>
        <p className="text-muted-foreground leading-relaxed">
          This platform was built to make our farewell memorable, organized, and
          fun. It serves as a central hub for all our memories, planning, and
          interactions.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-8 pt-8 border-t">
        <div>
          <h4 className="text-2xl font-bold text-primary">
            {stats.membersCount}+
          </h4>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Students
          </p>
        </div>
        <div>
          <h4 className="text-2xl font-bold text-primary">
            {stats.memoriesCount}+
          </h4>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Memories
          </p>
        </div>
        <div>
          <h4 className="text-2xl font-bold text-primary">{stats.funLevel}</h4>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Fun
          </p>
        </div>
      </div>

      <div className="pt-8 text-sm text-muted-foreground">
        <p>Version 1.0.0</p>
        <p>© 2025 Farewell System. All rights reserved. Made by Ravi Singh</p>
      </div>
    </div>
  );
}
