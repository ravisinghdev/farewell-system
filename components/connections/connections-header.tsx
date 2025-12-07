"use client";

import { useFarewell } from "@/components/providers/farewell-provider";
import { cn } from "@/lib/utils";
import { Image, Brush, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ConnectionsHeaderProps {
  title: string;
  description?: string;
  farewellId: string;
}

export function ConnectionsHeader({
  title,
  description,
  farewellId,
}: ConnectionsHeaderProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: `/dashboard/${farewellId}/memories`,
      label: "Gallery",
      icon: Image,
    },
    {
      href: `/dashboard/${farewellId}/artworks`,
      label: "Artworks",
      icon: Brush,
    },
    {
      href: `/dashboard/${farewellId}/yearbook`,
      label: "Yearbook",
      icon: BookOpen,
    },
  ];

  return (
    <div className="space-y-6 mb-8 animate-in slide-in-from-top-4 duration-500">
      {/* Title Section with Gradient */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 text-purple-500">
              <Sparkles className="w-6 h-6" />
            </span>
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground ml-1">{description}</p>
          )}
        </div>
      </div>

      {/* Unified Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none mask-fade-right">
        <div className="p-1 rounded-xl bg-muted/40 border border-white/5 flex items-center">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 rounded-lg text-xs font-medium h-9 px-3 transition-all duration-300",
                    isActive
                      ? "bg-background shadow-sm text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn("w-3.5 h-3.5", isActive && "text-primary")}
                  />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
