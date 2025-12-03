"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { postDutyUpdateAction } from "@/actions/duties";
import { toast } from "sonner";

interface DutyUpdatesFeedProps {
  duty: any;
  isAssignee: boolean;
  onUpdate: () => void;
}

export function DutyUpdatesFeed({
  duty,
  isAssignee,
  onUpdate,
}: DutyUpdatesFeedProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await postDutyUpdateAction(duty.id, content);
      setContent("");
      onUpdate();
      toast.success("Update posted");
    } catch (error) {
      toast.error("Failed to post update");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {isAssignee && duty.status === "in_progress" && (
        <div className="flex gap-4">
          <Avatar>
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Post an update..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              {/* Attachment button could go here */}
              <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Post Update
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {duty.duty_updates?.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No updates yet.
          </p>
        ) : (
          duty.duty_updates?.map((update: any) => (
            <div key={update.id} className="flex gap-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={update.users?.avatar_url} />
                <AvatarFallback>{update.users?.full_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">
                    {update.users?.full_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(update.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 bg-muted/50 p-3 rounded-md">
                  {update.content}
                </p>
                {update.attachments?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {update.attachments.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 flex items-center gap-1"
                      >
                        <Paperclip className="h-3 w-3" /> Attachment {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
