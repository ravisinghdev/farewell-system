"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, UserPlus, MessageSquarePlus } from "lucide-react";
import { searchUsersAction, createDMAction } from "@/app/actions/chat-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn, getInitials } from "@/lib/utils";

import { SearchResult } from "@/types/custom";

interface UserSearchDialogProps {
  farewellId: string;
  trigger?: React.ReactNode;
}

export function UserSearchDialog({
  farewellId,
  trigger,
}: UserSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, startSearch] = useTransition();
  const [isCreating, startCreate] = useTransition();
  const router = useRouter();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 1) {
      startSearch(async () => {
        const users = await searchUsersAction(val, farewellId); // Global search
        setResults(users);
      });
    } else {
      setResults([]);
    }
  };

  // handleStartDM moved to inner function or used from props

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-auto bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all rounded-full px-4"
          >
            <MessageSquarePlus className="mr-2 h-4 w-4 text-primary" />
            <span className="hidden sm:inline">New Chat</span>
            <span className="sm:hidden">New</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Start a Conversation
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={query}
              onChange={handleSearch}
              className="pl-9 h-11 bg-muted/30 border-muted-foreground/20 focus:border-primary/50 focus:bg-background transition-all rounded-xl"
            />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary/50" />
                <p className="text-xs">Searching...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="grid gap-2">
                {results.map((user) => (
                  <UserItem
                    key={user.id}
                    user={user}
                    isCreating={isCreating}
                    onStartDM={() => handleStartDM(user.id)}
                  />
                ))}
              </div>
            ) : query.length > 1 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Search className="h-6 w-6 opacity-50" />
                </div>
                <p className="text-sm font-medium">No users found</p>
                <p className="text-xs opacity-70">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground opacity-50">
                <p className="text-sm">Type to search for people</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  function handleStartDM(userId: string) {
    startCreate(async () => {
      const result = await createDMAction(userId, farewellId);
      if ("error" in result && result.error) {
        toast(result.error);
      } else if ("channelId" in result && result.channelId) {
        setOpen(false);
        router.refresh();
        router.push(
          `/dashboard/${farewellId}/messages?channel=${result.channelId}`
        );
        toast.success("Request sent!");
      }
    });
  }
}

function UserItem({
  user,
  isCreating,
  onStartDM,
}: {
  user: SearchResult;
  isCreating: boolean;
  onStartDM: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-colors group border border-transparent hover:border-border/50">
      <div className="flex items-center gap-3 overflow-hidden">
        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
          <AvatarImage src={user.avatar_url || ""} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
            {user.full_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
            {user.full_name}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onStartDM()}
        disabled={isCreating}
        className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-8 px-3"
      >
        {isCreating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Request
          </>
        )}
      </Button>
    </div>
  );
}
