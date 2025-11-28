"use client";

import { Highlight } from "@/app/actions/dashboard-actions";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";

interface HighlightCardProps {
  highlight: Highlight;
}

export function HighlightCard({ highlight }: HighlightCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group h-full flex flex-col">
      {highlight.image_url && (
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={highlight.image_url}
            alt={highlight.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-xl leading-tight group-hover:text-primary transition-colors">
            {highlight.title}
          </h3>
          <span className="text-xs text-muted-foreground whitespace-nowrap mt-1">
            {format(new Date(highlight.created_at), "MMM d")}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {highlight.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {highlight.description}
          </p>
        )}
      </CardContent>
      {highlight.link && (
        <CardFooter className="pt-0">
          <Button asChild variant="outline" size="sm" className="w-full gap-2">
            <Link
              href={highlight.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              View More <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
