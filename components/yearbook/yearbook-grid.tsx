"use client";

import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, User } from "lucide-react";
import { deleteYearbookEntryAction } from "@/app/actions/yearbook-actions";
import { toast } from "sonner";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

interface YearbookEntry {
  id: string;
  student_name: string;
  quote: string | null;
  photo_url: string | null;
  section: string | null;
  created_by: string | null;
  created_at: string | null;
}

interface YearbookGridProps {
  entries: YearbookEntry[];
  farewellId: string;
}

export function YearbookGrid({ entries, farewellId }: YearbookGridProps) {
  useRealtimeSubscription({
    table: "yearbook_entries",
    filter: `farewell_id=eq.${farewellId}`,
  });

  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteYearbookEntryAction(id, farewellId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Entry deleted");
      }
    });
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20 border-dashed">
        No yearbook entries yet. Add yours now!
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {entries.map((entry) => (
        <Card
          key={entry.id}
          className="overflow-hidden group h-full flex flex-col"
        >
          <div className="relative aspect-square bg-muted">
            {entry.photo_url ? (
              <Image
                src={entry.photo_url}
                alt={entry.student_name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <User className="h-12 w-12" />
              </div>
            )}
            {entry.section && (
              <Badge className="absolute top-2 right-2" variant="secondary">
                {entry.section}
              </Badge>
            )}
          </div>
          <CardContent className="p-4 flex-1">
            <h3 className="font-bold text-lg truncate">{entry.student_name}</h3>
            {entry.quote && (
              <blockquote className="mt-2 text-sm italic text-muted-foreground border-l-2 pl-2">
                "{entry.quote}"
              </blockquote>
            )}
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleDelete(entry.id)}
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
