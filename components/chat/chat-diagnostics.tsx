"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, XCircle, Play, Clock } from "lucide-react";
import {
  getChannelsAction,
  searchUsersAction,
  createChannelAction,
  sendMessageAction,
  getMessagesAction,
  deleteChannelAction,
} from "@/app/actions/chat-actions";
import { toast } from "sonner";

interface TestResult {
  name: string;
  status: "pending" | "running" | "success" | "error";
  time?: number;
  message?: string;
}

export function ChatDiagnostics({ farewellId }: { farewellId: string }) {
  const [results, setResults] = useState<TestResult[]>([
    { name: "Fetch Channels (Primary)", status: "pending" },
    { name: "Fetch Channels (Requests)", status: "pending" },
    { name: "Search Users", status: "pending" },
    { name: "Create Test Group", status: "pending" },
    { name: "Send Message", status: "pending" },
    { name: "Fetch Messages", status: "pending" },
    { name: "Delete Test Group", status: "pending" },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async (
    index: number,
    fn: () => Promise<any>
  ): Promise<any> => {
    setResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, status: "running" } : r))
    );

    const start = performance.now();
    try {
      const res = await fn();
      const end = performance.now();
      const time = Math.round(end - start);

      setResults((prev) =>
        prev.map((r, i) =>
          i === index ? { ...r, status: "success", time } : r
        )
      );
      return res;
    } catch (error: any) {
      const end = performance.now();
      setResults((prev) =>
        prev.map((r, i) =>
          i === index
            ? {
                ...r,
                status: "error",
                time: Math.round(end - start),
                message: error.message || "Failed",
              }
            : r
        )
      );
      throw error;
    }
  };

  const startDiagnostics = async () => {
    setIsRunning(true);
    let testGroupId: string | null = null;

    try {
      // 1. Fetch Primary
      await runTest(0, async () => {
        const res = await getChannelsAction(farewellId, "primary");
        if (!Array.isArray(res)) throw new Error("Invalid response");
      });

      // 2. Fetch Requests
      await runTest(1, async () => {
        const res = await getChannelsAction(farewellId, "requests");
        if (!Array.isArray(res)) throw new Error("Invalid response");
      });

      // 3. Search Users
      await runTest(2, async () => {
        const res = await searchUsersAction("a", farewellId);
        if (!Array.isArray(res)) throw new Error("Invalid response");
      });

      // 4. Create Group
      await runTest(3, async () => {
        const name = `Test Group ${Date.now()}`;
        const res = await createChannelAction(name, farewellId, "group");
        if ("error" in res && res.error) throw new Error(res.error);
        if ("channelId" in res) {
          testGroupId = res.channelId;
          return res;
        }
        throw new Error("Failed to create group");
      });

      if (testGroupId) {
        // 5. Send Message
        await runTest(4, async () => {
          const formData = new FormData();
          formData.append("content", "Hello from diagnostics!");
          formData.append("channelId", testGroupId!);

          const res = await sendMessageAction(formData);
          if ("error" in res && res.error) throw new Error(res.error);
        });

        // 6. Fetch Messages
        await runTest(5, async () => {
          const res = await getMessagesAction(testGroupId!);
          if (!res || res.length === 0) throw new Error("No messages found");
        });

        // 7. Delete Group
        await runTest(6, async () => {
          const res = await deleteChannelAction(testGroupId!, farewellId);
          if ("error" in res && res.error) throw new Error(res.error);
        });
      }
    } catch (error) {
      console.error("Diagnostics failed:", error);
      toast.error("Diagnostics stopped due to error");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>System Diagnostics & Performance</CardTitle>
        <Button onClick={startDiagnostics} disabled={isRunning}>
          {isRunning ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Run Tests
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {results.map((test, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  {test.status === "pending" && (
                    <div className="h-5 w-5 rounded-full border-2 border-muted" />
                  )}
                  {test.status === "running" && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  )}
                  {test.status === "success" && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {test.status === "error" && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">{test.name}</p>
                    {test.message && (
                      <p className="text-xs text-red-500">{test.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                  {test.time !== undefined && (
                    <>
                      <Clock className="h-3 w-3" />
                      {test.time}ms
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
