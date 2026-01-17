"use client";

import { useFarewell } from "@/components/providers/farewell-provider";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface PageScaffoldProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  requireAdmin?: boolean;
  action?: React.ReactNode;
}

export function PageScaffold({
  title,
  description,
  children,
  requireAdmin = false,
  action,
}: PageScaffoldProps) {
  const { farewell } = useFarewell();
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!farewell.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`page:${farewell.id}:${title}`)
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewell.id, title]);

  const isAdmin = ["admin", "parallel_admin", "main_admin"].includes(
    farewell.role || ""
  );

  if (requireAdmin && !isAdmin) {
    return (
      <div className="px-4 py-20 text-center">
        <h2 className="text-xl font-semibold text-destructive">
          Access denied
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You don’t have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {title}
            </h1>

            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span
                className={`h-2 w-2 rounded-full ${
                  isLive ? "bg-emerald-500" : "bg-yellow-400"
                }`}
              />
              {isLive ? "Live" : "Connecting"}
            </span>
          </div>

          {description && (
            <p className="text-sm text-muted-foreground max-w-xl">
              {description}
            </p>
          )}
        </div>

        {action && <div className="pt-2 sm:pt-0">{action}</div>}
      </div>

      {/* Spacer instead of box */}
      <div className="h-6 sm:h-8" />

      {/* Content flows naturally */}
      <div className="space-y-4">
        {children ?? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            Content coming soon.
          </div>
        )}
      </div>
    </div>
  );
}
