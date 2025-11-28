"use client";

import { Letter } from "@/app/actions/letters-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import { format } from "date-fns";
import { Quote } from "lucide-react";

interface LetterCardProps {
  letter: Letter;
  currentUserId: string;
}

export function LetterCard({ letter, currentUserId }: LetterCardProps) {
  const isOwn = letter.sender_id === currentUserId;

  return (
    <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-muted/20 hover:shadow-lg transition-all duration-300 group">
      <CardHeader className="flex flex-row items-start gap-4 pb-2 space-y-0">
        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
          <AvatarImage src={letter.sender?.avatar_url || ""} />
          <AvatarFallback>
            {getInitials(letter.sender?.full_name || "?")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold truncate">
              {letter.sender?.full_name || "Unknown"}
            </p>
            <span className="text-xs text-muted-foreground">
              {format(new Date(letter.created_at), "MMM d, yyyy")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            To:{" "}
            <span className="font-medium text-primary/80">
              {letter.recipient ? letter.recipient.full_name : "Class of 2024"}
            </span>
          </p>
        </div>
      </CardHeader>
      <CardContent className="relative pt-2">
        <Quote className="absolute top-0 left-4 h-6 w-6 text-muted-foreground/10 -scale-x-100" />
        <p className="text-sm leading-relaxed whitespace-pre-wrap pl-2 relative z-10 text-foreground/90 font-serif italic">
          "{letter.content}"
        </p>
      </CardContent>
    </Card>
  );
}
