import { getActivityLogsAction } from "@/app/actions/activity-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const logs = await getActivityLogsAction(id);

  return (
    <div className="flex flex-col h-full space-y-6 p-6 pt-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Activity</h2>
          <p className="text-muted-foreground">
            Monitor actions and changes across the farewell.
          </p>
        </div>
      </div>

      <Card className="flex-1 bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-primary" />
            Recent Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="divide-y divide-border">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No activity recorded yet.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="w-8 h-8 mt-1 border border-border">
                      <AvatarImage src={log.user?.avatar_url} />
                      <AvatarFallback>
                        {log.user?.full_name?.substring(0, 2) || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {log.user?.full_name || "Unknown User"}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Executed{" "}
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">
                          {log.action}
                        </span>
                        {log.target_type && (
                          <span className="ml-1">on {log.target_type}</span>
                        )}
                      </p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="text-xs text-muted-foreground/70 bg-muted/30 p-2 rounded mt-2 font-mono overflow-x-auto">
                          {JSON.stringify(log.metadata)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
