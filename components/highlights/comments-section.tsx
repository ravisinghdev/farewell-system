"use client";

import { useState, useEffect, useTransition } from "react";
import {
  getHighlightCommentsAction,
  addHighlightCommentAction,
} from "@/app/actions/dashboard-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, SendHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function CommentsSection({
  highlightId,
  farewellId,
}: {
  highlightId: string;
  farewellId: string;
}) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function load() {
      const data = await getHighlightCommentsAction(highlightId);
      setComments(data);
      setLoading(false);
    }
    load();
  }, [highlightId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // Optimistic UI could be added here
    startTransition(async () => {
      await addHighlightCommentAction(highlightId, newComment, farewellId);
      setNewComment("");
      const newData = await getHighlightCommentsAction(highlightId);
      setComments(newData);
    });
  };

  return (
    <div className="p-4 space-y-4">
      {loading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {comments.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-2">
              No comments yet. Be the first!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5">
                <Avatar className="h-6 w-6 mt-0.5">
                  <AvatarImage src={comment.user?.avatar_url} />
                  <AvatarFallback className="text-[10px]">
                    {comment.user?.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-0.5 bg-background border p-2.5 rounded-tr-xl rounded-br-xl rounded-bl-xl text-sm shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">
                      {comment.user?.full_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-muted-foreground/90">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 relative"
      >
        <Input
          placeholder="Write a comment..."
          className="pr-10 h-10 bg-background"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={isPending}
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          className="absolute right-1 w-8 h-8 text-primary hover:bg-primary/10 rounded-full"
          disabled={!newComment.trim() || isPending}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <SendHorizontal className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}




