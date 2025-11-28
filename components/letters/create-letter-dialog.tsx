"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createLetterAction } from "@/app/actions/letters-actions";
import { toast } from "sonner";
import { Loader2, MailPlus } from "lucide-react";
// Actually, let's make a simple recipient selector or just use a text input for now if search is complex.
// Better: Use the existing UserSearchDialog logic but adapted?
// Let's just use a simple "To All Seniors" toggle and if off, show a search input?
// For MVP, let's just allow "To All" or "To Specific Person" (which opens a search).

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchUsersAction } from "@/app/actions/chat-actions";

interface CreateLetterDialogProps {
  farewellId: string;
}

export function CreateLetterDialog({ farewellId }: CreateLetterDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [recipient, setRecipient] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, startSearch] = useTransition();

  const handleSearch = (val: string) => {
    setQuery(val);
    if (val.length > 1) {
      startSearch(async () => {
        const res = await searchUsersAction(val, farewellId);
        setSearchResults(res);
      });
    }
  };

  const handleSubmit = () => {
    if (!content.trim()) return;

    startTransition(async () => {
      const res = await createLetterAction(
        farewellId,
        content,
        recipient?.id || null,
        isPublic
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Letter sent successfully!");
        setOpen(false);
        setContent("");
        setRecipient(null);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <MailPlus className="h-4 w-4" />
          Write a Letter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Write a Letter to Seniors</DialogTitle>
          <DialogDescription>
            Share your memories, gratitude, or wishes. You can write to the
            whole class or a specific person.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label>To</Label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={searchOpen}
                  className="justify-between w-full"
                >
                  {recipient ? recipient.name : "All Seniors (Class of 2024)"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search for a senior..."
                    value={query}
                    onValueChange={handleSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No person found.</CommandEmpty>
                    <CommandGroup heading="Suggestions">
                      <CommandItem
                        onSelect={() => {
                          setRecipient(null);
                          setSearchOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !recipient ? "opacity-100" : "opacity-0"
                          )}
                        />
                        All Seniors (General)
                      </CommandItem>
                      {searchResults.map((user) => (
                        <CommandItem
                          key={user.id}
                          onSelect={() => {
                            setRecipient({ id: user.id, name: user.full_name });
                            setSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              recipient?.id === user.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {user.full_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              placeholder="Write your heart out..."
              className="h-32 resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg bg-muted/20">
            <Label
              htmlFor="public-mode"
              className="flex flex-col space-y-1 cursor-pointer"
            >
              <span>Public Letter</span>
              <span className="font-normal text-xs text-muted-foreground">
                Visible to everyone in the farewell
              </span>
            </Label>
            <Switch
              id="public-mode"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !content.trim()}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Letter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
