"use client";

import { useFarewell } from "@/components/providers/farewell-provider";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";

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
  const { user, farewell } = useFarewell();
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    if (!farewell.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(
        `page-${title.toLowerCase().replace(/\s+/g, "-")}:${farewell.id}`
      )
      .on("broadcast", { event: "ping" }, () => {
        // Keep alive
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsRealtimeConnected(true);
        } else {
          setIsRealtimeConnected(false);
        }
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
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-1">
        <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
        <p className="text-muted-foreground mt-2">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-1 space-y-1 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {title}
            <div
              className={`h-2 w-2 rounded-full ${
                isRealtimeConnected ? "bg-green-500" : "bg-yellow-500"
              } shadow-[0_0_8px_rgba(0,0,0,0.2)]`}
              title={isRealtimeConnected ? "Realtime Active" : "Connecting..."}
            />
          </h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div className="min-h-[400px] border rounded-xl bg-muted/5 p-6 backdrop-blur-sm relative overflow-hidden">
        {children || (
          <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
            <p>Content for {title} is coming soon.</p>
            <p className="text-xs mt-2 opacity-50">Role: {farewell.role}</p>
          </div>
        )}
      </div>
    </div>
  );
}
