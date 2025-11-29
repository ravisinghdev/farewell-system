"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import {
  Ban,
  BellOff,
  Lock,
  MoreVertical,
  Phone,
  Pin,
  PinOff,
  Search,
  Users,
  Video,
} from "lucide-react";
import { GroupInfoDialog } from "../group-info-dialog";
import { ChatMember } from "@/app/actions/chat-actions";
import { motion } from "framer-motion";

interface ChatHeaderProps {
  channelName?: string;
  isPinned?: boolean;
  otherUserId?: string;
  peerPublicKey?: string | null;
  isRequest?: boolean;
  members: ChatMember[];
  channelId: string;
  farewellId: string;
  currentUserId: string;
  isFarewellAdmin?: boolean;
  onPin: () => void;
  onRestrict: () => void;
  onBlock: () => void;
}

export function ChatHeader({
  channelName,
  isPinned,
  otherUserId,
  peerPublicKey,
  isRequest,
  members,
  channelId,
  farewellId,
  currentUserId,
  isFarewellAdmin,
  onPin,
  onRestrict,
  onBlock,
}: ChatHeaderProps) {
  const otherMember = members.find((m) => m.user_id === otherUserId);
  const avatarUrl = otherMember?.user?.avatar_url;

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="absolute top-4 left-4 right-4 z-30"
    >
      <div className="flex items-center justify-between p-2 md:pl-3 pl-12 pr-2 bg-white/10 dark:bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/5 ring-1 ring-white/5">
        {/* Left: Info */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <Avatar className="h-10 w-10 border border-white/10 shadow-inner">
              <AvatarImage src={avatarUrl || ""} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium text-sm">
                {getInitials(channelName || "#")}
              </AvatarFallback>
            </Avatar>
            {/* Status Dot (Mockup for now, can be real later) */}
            {otherUserId && !isRequest && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 border-2 border-black rounded-full shadow-sm" />
            )}
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white text-sm tracking-tight shadow-sm">
                {channelName || "Chat"}
              </span>
              {isPinned && (
                <Pin className="h-3 w-3 text-yellow-400 fill-yellow-400/20" />
              )}
              {otherUserId && peerPublicKey && (
                <div className="flex items-center gap-0.5 px-1 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400 font-medium">
                  <Lock className="h-2.5 w-2.5" />
                  <span>E2EE</span>
                </div>
              )}
            </div>
            {isRequest ? (
              <span className="text-[10px] text-yellow-400/90 font-medium">
                Message Request
              </span>
            ) : (
              <span className="text-[11px] text-white/50 font-medium flex items-center gap-1">
                {otherUserId ? "Active now" : `${members.length} members`}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Call Buttons (Visual Only) */}
          {otherUserId && !isRequest && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Video className="h-4 w-4" />
              </Button>
            </>
          )}

          <div className="h-4 w-px bg-white/10 mx-1" />

          {!otherUserId && (
            <GroupInfoDialog
              channelId={channelId}
              farewellId={farewellId}
              members={members}
              channelName={channelName || "Group Chat"}
              currentUserId={currentUserId}
              isFarewellAdmin={isFarewellAdmin}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Users className="h-4 w-4" />
                </Button>
              }
            />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 bg-black/80 backdrop-blur-xl border-white/10 text-white p-1 rounded-xl shadow-2xl"
            >
              <DropdownMenuItem
                onClick={onPin}
                className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg py-2"
              >
                {isPinned ? (
                  <PinOff className="mr-2 h-4 w-4 text-white/70" />
                ) : (
                  <Pin className="mr-2 h-4 w-4 text-white/70" />
                )}
                <span className="font-medium">
                  {isPinned ? "Unpin Chat" : "Pin Chat"}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onRestrict}
                className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg py-2"
              >
                <BellOff className="mr-2 h-4 w-4 text-white/70" />
                <span className="font-medium">Mute Notifications</span>
              </DropdownMenuItem>
              {otherUserId && (
                <>
                  <DropdownMenuSeparator className="bg-white/10 my-1" />
                  <DropdownMenuItem
                    onClick={onBlock}
                    className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer rounded-lg py-2"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    <span className="font-medium">Block User</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}
