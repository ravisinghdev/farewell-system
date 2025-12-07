"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";
import { NavUser } from "@/components/nav-user";
import { ThemeToggle } from "@/components/theme-toggler";
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

import { useFarewell } from "@/components/providers/farewell-provider";
import { NotificationBell } from "./notifications/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import Link from "next/link";

interface SiteHeaderProps {
  user?: any; // Kept for backward compatibility but unused
  farewellId?: string; // Kept for backward compatibility but unused
}

export function SiteHeader({}: SiteHeaderProps) {
  const { user, farewell } = useFarewell();
  const farewellId = farewell.id;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-white/5 bg-background/40 backdrop-blur-xl px-4 shadow-sm z-50 sticky top-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />
        <Separator orientation="vertical" className="mr-2 h-4 bg-border/50" />
        <DashboardBreadcrumb />
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1">
          <NotificationBell userId={user.id} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 transition-colors hover:bg-accent/50"
              >
                <Grip className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-72 p-0 overflow-hidden bg-popover/80 backdrop-blur-xl border-white/10 shadow-2xl rounded-2xl"
            >
              <div className="p-3 bg-muted/30 border-b border-white/5">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick Access
                </h4>
              </div>
              <div className="grid grid-cols-3 gap-1 p-2">
                <Link
                  href={`/dashboard/${farewellId}`}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 hover:bg-white/5 hover:text-primary transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:scale-110 transition-transform">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Home
                  </span>
                </Link>
                <Link
                  href={`/dashboard/${farewellId}/contributions`}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 hover:bg-white/5 hover:text-primary transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 group-hover:scale-110 transition-transform">
                    <PiggyBank className="h-5 w-5 text-emerald-500" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Pay
                  </span>
                </Link>
                <Link
                  href={`/dashboard/${farewellId}/memories`}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 hover:bg-white/5 hover:text-primary transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 group-hover:scale-110 transition-transform">
                    <Image className="h-5 w-5 text-purple-500" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Gallery
                  </span>
                </Link>
                <Link
                  href={`/dashboard/${farewellId}/farewell-event`}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 hover:bg-white/5 hover:text-primary transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 group-hover:scale-110 transition-transform">
                    <PartyPopper className="h-5 w-5 text-orange-500" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Event
                  </span>
                </Link>
                <Link
                  href={`/dashboard/${farewellId}/messages`}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 hover:bg-white/5 hover:text-primary transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Chat
                  </span>
                </Link>
                <Link
                  href={`/dashboard/${farewellId}/settings`}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 hover:bg-white/5 hover:text-primary transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-500/10 group-hover:scale-110 transition-transform">
                    <Settings className="h-5 w-5 text-zinc-500" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Settings
                  </span>
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
        </div>

        <div className="h-6 w-px bg-border/50 mx-1" />

        <NavUser user={user} farewellId={farewellId} />
      </div>
    </header>
  );
}
