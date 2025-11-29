"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn, getInitials } from "@/lib/utils";
import {
  Check,
  Edit2,
  FileIcon,
  Heart,
  MoreHorizontal,
  Smile,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Message } from "../chat-types";
import { format } from "date-fns";
import { ChatMember } from "@/app/actions/chat-actions";
import { motion } from "framer-motion";

interface MessageItemProps {
  message: Message;
  isMe: boolean;
  showAvatar: boolean;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  currentUserId: string;
  channelMembers: ChatMember[];
  isGroup: boolean;
  onReply: (message: Message) => void;
}

export function MessageItem({
  message,
  isMe,
  showAvatar,
  onEdit,
  onDelete,
  onReaction,
  currentUserId,
  channelMembers,
  isGroup,
  onReply,
}: MessageItemProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const sender = channelMembers.find((m) => m.user_id === message.user_id);
  const senderName = sender?.user?.full_name || "Unknown User";
  const senderAvatar = sender?.user?.avatar_url;

  const handleSaveEdit = () => {
    if (editContent && editContent.trim() !== message.content) {
      onEdit(message.id, editContent);
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "group flex items-end gap-3 mb-4 w-full",
        isMe ? "flex-row-reverse" : "flex-row"
      )}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      {/* Avatar */}
      {!isMe && (
        <div className="w-8 flex-shrink-0">
          {showAvatar ? (
            <Avatar className="h-8 w-8 border-2 border-white/10 shadow-md">
              <AvatarImage src={senderAvatar || ""} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[10px]">
                {getInitials(senderName)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}

      <div
        className={cn(
          "flex flex-col max-w-[70%]",
          isMe ? "items-end" : "items-start"
        )}
      >
        {/* Sender Name (Group only) */}
        {!isMe && isGroup && showAvatar && (
          <span className="text-[10px] text-muted-foreground/60 ml-1 mb-1 font-medium">
            {senderName}
          </span>
        )}

        {/* Message Bubble */}
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={cn(
                "relative px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed break-words",
                isMe
                  ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-sm shadow-indigo-500/20"
                  : "bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/10 text-foreground rounded-tl-sm shadow-black/5"
              )}
            >
              {isEditing ? (
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <Input
                    value={editContent || ""}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="bg-black/20 border-white/10 text-white h-8 text-sm"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                      className="h-6 text-xs hover:bg-white/10 text-white/70"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className="h-6 text-xs bg-white/20 hover:bg-white/30 text-white"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {message.file_url && (
                    <div className="mb-2">
                      {message.type === "image" ? (
                        <div className="relative rounded-lg overflow-hidden border border-white/10">
                          <img
                            src={message.file_url}
                            alt="attachment"
                            className="max-w-full h-auto max-h-60 object-cover"
                          />
                        </div>
                      ) : (
                        <a
                          href={message.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                        >
                          <FileIcon className="h-4 w-4" />
                          <span className="underline truncate max-w-[150px]">
                            Attachment
                          </span>
                        </a>
                      )}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </>
              )}

              {/* Timestamp & Edited Status */}
              <div
                className={cn(
                  "text-[9px] mt-1 flex items-center gap-1 justify-end opacity-70",
                  isMe ? "text-indigo-100" : "text-muted-foreground"
                )}
              >
                {message.edited_at && <span>(edited)</span>}
                {message.created_at &&
                  format(new Date(message.created_at), "h:mm a")}
                {isMe && (
                  <span className="ml-0.5">
                    {/* Read receipts could go here */}
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>

              {/* Reactions Display */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="absolute -bottom-3 right-0 flex gap-0.5 bg-black/40 backdrop-blur-xl rounded-full px-1.5 py-0.5 border border-white/10 shadow-sm z-10">
                  {message.reactions.map((reaction, i) => (
                    <span key={i} className="text-[10px] leading-none">
                      {reaction.reaction}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="bg-black/80 backdrop-blur-xl border-white/10 text-white">
            <ContextMenuItem
              onClick={() => onReaction(message.id, "👍")}
              className="focus:bg-white/10 focus:text-white cursor-pointer"
            >
              <ThumbsUp className="mr-2 h-4 w-4" /> Like
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onReaction(message.id, "❤️")}
              className="focus:bg-white/10 focus:text-white cursor-pointer"
            >
              <Heart className="mr-2 h-4 w-4" /> Love
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onReaction(message.id, "😂")}
              className="focus:bg-white/10 focus:text-white cursor-pointer"
            >
              <Smile className="mr-2 h-4 w-4" /> Laugh
            </ContextMenuItem>
            {isMe && (
              <>
                <ContextMenuSeparator className="bg-white/10" />
                <ContextMenuItem
                  onClick={() => setIsEditing(true)}
                  className="focus:bg-white/10 focus:text-white cursor-pointer"
                >
                  <Edit2 className="mr-2 h-4 w-4" /> Edit
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => onDelete(message.id)}
                  className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>
      </div>

      {/* Hover Actions (Desktop) */}
      <div
        className={cn(
          "opacity-0 transition-opacity duration-200 flex items-center gap-1",
          showReactions ? "opacity-100" : "opacity-0",
          isMe ? "mr-2" : "ml-2"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground"
          onClick={() => onReaction(message.id, "👍")}
        >
          <ThumbsUp className="h-3 w-3" />
        </Button>
        {isMe && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isMe ? "end" : "start"}
              className="bg-black/80 backdrop-blur-xl border-white/10 text-white"
            >
              <DropdownMenuItem
                onClick={() => setIsEditing(true)}
                className="focus:bg-white/10 focus:text-white cursor-pointer"
              >
                <Edit2 className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(message.id)}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.div>
  );
}
