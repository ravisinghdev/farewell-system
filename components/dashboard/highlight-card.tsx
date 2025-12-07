"use client";

import { Highlight } from "@/app/actions/dashboard-actions";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface HighlightCardProps {
  highlight: Highlight;
  isHero?: boolean;
}

export function HighlightCard({
  highlight,
  isHero = false,
}: HighlightCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl transition-all duration-500",
        isHero ? "h-[500px] w-full" : "h-[350px] w-full"
      )}
    >
      {/* Background Image */}
      {highlight.image_url ? (
        <Image
          src={highlight.image_url}
          alt={highlight.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent" />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
        {/* Date Badge */}
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 text-xs font-medium text-white/90 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <Calendar className="w-3.5 h-3.5" />
          {format(new Date(highlight.created_at), "MMM d, yyyy")}
        </div>

        <div className="space-y-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          {isHero && (
            <span className="inline-block px-3 py-1 rounded-full bg-primary/80 backdrop-blur-md text-primary-foreground text-xs font-bold uppercase tracking-widest mb-1 shadow-lg">
              Featured
            </span>
          )}

          <h3
            className={cn(
              "font-bold leading-tight text-white drop-shadow-lg",
              isHero ? "text-3xl sm:text-4xl max-w-2xl" : "text-xl sm:text-2xl"
            )}
          >
            {highlight.title}
          </h3>

          {highlight.description && (
            <p
              className={cn(
                "text-white/80 line-clamp-2 leading-relaxed max-w-xl",
                isHero ? "text-lg" : "text-sm"
              )}
            >
              {highlight.description}
            </p>
          )}

          {highlight.link && (
            <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white hover:text-black hover:border-white h-8 px-4 text-xs font-medium backdrop-blur-sm"
              >
                <Link
                  href={highlight.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit Link <ExternalLink className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Glass Shine */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
}
