"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  X,
  ShieldAlert,
  Loader2,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAdminChatRequestsAction,
  resolveComplaintAction,
  approveChannelAction,
  deleteChannelAction,
} from "@/app/actions/chat-actions";
import { getInitials } from "@/lib/utils";
import { supabaseClient } from "@/utils/supabase/client";

interface AdminRequestPanelProps {
  farewellId: string;
  trigger?: React.ReactNode;
}

export function AdminRequestPanel({
  farewellId,
  trigger,
}: AdminRequestPanelProps) {
  const [open, setOpen] = useState(false);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [groupRequests, setGroupRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAdminChatRequestsAction(farewellId);
      setComplaints(data.complaints);
      setGroupRequests(data.groupRequests);
    } catch (error) {
      console.error("Failed to fetch admin requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();

      const channel = supabaseClient
        .channel(`admin_panel:${farewellId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "chat_complaints",
            filter: `farewell_id=eq.${farewellId}`,
          },
          () => fetchData()
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "chat_channels",
            filter: `scope_id=eq.${farewellId}`,
          },
          () => fetchData()
        )
        .subscribe();

      return () => {
        supabaseClient.removeChannel(channel);
      };
    }
  }, [open, farewellId]);

  const handleResolveComplaint = (id: string, action: "resolve" | "reject") => {
    startTransition(async () => {
      const res = await resolveComplaintAction(id, action, farewellId);
      if (res && "error" in res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          action === "resolve" ? "User added to group" : "Complaint rejected"
        );
        // Optimistic Update
        setComplaints((prev) => prev.filter((c) => c.id !== id));
      }
    });
  };

  const handleGroupAction = (
    channelId: string,
    action: "approve" | "reject"
  ) => {
    startTransition(async () => {
      let res;
      if (action === "approve") {
        res = await approveChannelAction(channelId, farewellId);
      } else {
        res = await deleteChannelAction(channelId, farewellId);
      }

      if (res && "error" in res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          action === "approve" ? "Group approved" : "Group rejected"
        );
        // Optimistic Update
        setGroupRequests((prev) => prev.filter((g) => g.id !== channelId));
      }
    });
  };

  const totalCount = complaints.length + groupRequests.length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="relative">
            <ShieldAlert className="h-5 w-5" />
            {totalCount > 0 && (
              <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse" />
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Admin Requests</SheetTitle>
          <SheetDescription>
            Manage group creation requests and user complaints.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="complaints" className="mt-6 h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="complaints" className="relative">
              Complaints
              {complaints.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]"
                >
                  {complaints.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="groups" className="relative">
              Group Requests
              {groupRequests.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]"
                >
                  {groupRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <TabsContent value="complaints" className="h-full mt-0">
                  <ScrollArea className="h-[calc(100vh-200px)] pr-4">
                    {complaints.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <Check className="h-8 w-8 mb-2 opacity-50" />
                        <p>No pending complaints</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {complaints.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                          >
                            <Avatar>
                              <AvatarImage src={c.user?.avatar_url} />
                              <AvatarFallback>
                                {getInitials(c.user?.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm">
                                  {c.user?.full_name}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(c.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p className="font-medium text-foreground/80">
                                  {c.type === "default_group"
                                    ? "Default Group Request"
                                    : "Custom Issue"}
                                </p>
                                <p className="mt-1 text-xs">
                                  {c.reason || "No details provided."}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() =>
                                  handleResolveComplaint(c.id, "resolve")
                                }
                                disabled={isPending}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() =>
                                  handleResolveComplaint(c.id, "reject")
                                }
                                disabled={isPending}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="groups" className="h-full mt-0">
                  <ScrollArea className="h-[calc(100vh-200px)] pr-4">
                    {groupRequests.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <Check className="h-8 w-8 mb-2 opacity-50" />
                        <p>No pending group requests</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {groupRequests.map((g) => (
                          <div
                            key={g.id}
                            className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                          >
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {getInitials(g.name)}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm">{g.name}</p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(g.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Created by {g.creator?.full_name || "Unknown"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() =>
                                  handleGroupAction(g.id, "approve")
                                }
                                disabled={isPending}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() =>
                                  handleGroupAction(g.id, "reject")
                                }
                                disabled={isPending}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
