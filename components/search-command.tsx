"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  LayoutDashboard,
  Image as ImageIcon,
  MessageSquare,
  History,
  LogOut,
  Bell,
  Search,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useFarewell } from "@/components/providers/farewell-provider";

interface SearchCommandProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function SearchCommand({ open, setOpen }: SearchCommandProps) {
  const router = useRouter();
  const { farewell, user } = useFarewell();
  const farewellId = farewell.id;

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false);
      command();
    },
    [setOpen]
  );

  if (!farewellId) return null;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Suggestions">
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push(`/dashboard/${farewellId}`))
            }
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                router.push(`/dashboard/${farewellId}/contributions`)
              )
            }
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Make a Contribution</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push(`/dashboard/${farewellId}/memories`))
            }
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            <span>Gallery</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push(`/dashboard/${farewellId}/messages`))
            }
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Chat & Messages</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                router.push(`/dashboard/${farewellId}/farewell-event`)
              )
            }
          >
            <Calendar className="mr-2 h-4 w-4" />
            <span>Event Details</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                router.push(`/dashboard/${farewellId}/contributions/history`)
              )
            }
          >
            <History className="mr-2 h-4 w-4" />
            <span>Transaction History</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                router.push(`/dashboard/${farewellId}/settings/profile`)
              )
            }
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                router.push(`/dashboard/${farewellId}/settings/notifications`)
              )
            }
          >
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push(`/dashboard/${farewellId}/settings`))
            }
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}




