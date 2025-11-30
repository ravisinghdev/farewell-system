"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";
import { NavUser } from "@/components/nav-user";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Bell,
  Grip,
  Home,
  PiggyBank,
  Image,
  PartyPopper,
  MessageSquare,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { NotificationBell } from "@/components/notifications/notification-bell";

import { useFarewell } from "@/components/providers/farewell-provider";

interface SiteHeaderProps {
  user?: any; // Kept for backward compatibility but unused
  farewellId?: string; // Kept for backward compatibility but unused
}

export function SiteHeader({}: SiteHeaderProps) {
  const { user, farewell } = useFarewell();
  const farewellId = farewell.id;
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b bg-background/95 backdrop-blur-sm px-4 shadow-sm z-10 sticky top-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <DashboardBreadcrumb />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell userId={user.id} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground rounded-full mr-1"
            >
              <Grip className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2">
            <DropdownMenuLabel>Quick Apps</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="grid grid-cols-3 gap-2">
              <Link
                href={`/dashboard/${farewellId}`}
                className="flex flex-col items-center justify-center gap-1 rounded-lg p-2 hover:bg-muted transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <Home className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">Home</span>
              </Link>
              <Link
                href={`/dashboard/${farewellId}/contributions`}
                className="flex flex-col items-center justify-center gap-1 rounded-lg p-2 hover:bg-muted transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  <PiggyBank className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">Pay</span>
              </Link>
              <Link
                href={`/dashboard/${farewellId}/memories`}
                className="flex flex-col items-center justify-center gap-1 rounded-lg p-2 hover:bg-muted transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                  <Image className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">Gallery</span>
              </Link>
              <Link
                href={`/dashboard/${farewellId}/farewell-event`}
                className="flex flex-col items-center justify-center gap-1 rounded-lg p-2 hover:bg-muted transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
                  <PartyPopper className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">Event</span>
              </Link>
              <Link
                href={`/dashboard/${farewellId}/chat`}
                className="flex flex-col items-center justify-center gap-1 rounded-lg p-2 hover:bg-muted transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">Chat</span>
              </Link>
              <Link
                href={`/dashboard/${farewellId}/settings`}
                className="flex flex-col items-center justify-center gap-1 rounded-lg p-2 hover:bg-muted transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  <Settings className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">Settings</span>
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggle />
        <NavUser user={user} farewellId={farewellId} />
      </div>
    </header>
  );
}
