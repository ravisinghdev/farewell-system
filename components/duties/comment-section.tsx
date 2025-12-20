"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  createCommentAction,
  getDutyCommentsAction,
} from "@/app/actions/duty-enhanced-actions";
import { toast } from "sonner";
import { Send, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CommentSectionProps {
  dutyId: string;
  currentUserId: string;
}

export function CommentSection({ dutyId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadComments = async () => {
    const data = await getDutyCommentsAction(dutyId);
    setComments(data);
    setLoading(false);
  };

  useEffect(() => {
    loadComments();
  }, [dutyId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const result = await createCommentAction(dutyId, newComment);
      if (result.error) {
        toast.error(result.error);
      } else {
        setNewComment("");
        loadComments();
      }
    } catch (error) {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Loading comments...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="h-5 w-5" />
        Discussion ({comments.length})
      </div>

      {/* Comments List */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No comments yet. Start the discussion!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.users?.avatar_url} />
                  <AvatarFallback>
                    {comment.users?.full_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {comment.users?.full_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* New Comment */}
      <div className="space-y-2 pt-4 border-t">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
