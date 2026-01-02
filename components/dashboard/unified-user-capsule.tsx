"use client";

import * as React from "react";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  Settings,
  User,
  Palette,
  Search,
  Wallet,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

import { useFarewell } from "@/components/providers/farewell-provider";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { PremiumStatsPill } from "@/components/dashboard/premium-stats-pill";
import { cn } from "@/lib/utils";
import { SearchCommand } from "@/components/search-command";
import { ThemeToggle } from "@/components/theme-toggler";

interface UnifiedUserCapsuleProps {
  user: any;
  farewellId: string;
}

export function UnifiedUserCapsule({
  user,
  farewellId,
}: UnifiedUserCapsuleProps) {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const displayUser = user || {};
  const avatarUrl = displayUser.avatar_url || displayUser.avatar;
  const baseUrl = farewellId ? `/dashboard/${farewellId}` : "/dashboard";

  return (
    <>
      <SearchCommand open={isSearchOpen} setOpen={setIsSearchOpen} />

      {/* The Unified Capsule Container - Transparent Integration */}
      <div className="flex items-center shrink-0 z-50 ml-auto gap-1">
        {/* 1. Search Trigger (integrated) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSearchOpen(true)}
          className="h-8 w-8 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
        >
          <Search className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-white/10 mx-1.5" />

        {/* 2. Stats Pill (Visible on all screens) */}
        <div>
          <PremiumStatsPill
            farewellId={farewellId}
            userId={user?.id}
            theme="glass"
          />
        </div>

        <div className="hidden sm:block h-4 w-px bg-white/10 mx-1.5" />

        {/* 3. Theme Toggle (Hidden on mobile) */}
        <ThemeToggle className="hidden sm:block hover:bg-white/10 text-zinc-400 hover:text-white transition-colors h-8 w-8 rounded-full" />

        <div className="h-4 w-px bg-white/10 mx-1.5" />

        {/* 4. Notification Bell */}
        <NotificationBell userId={user?.id} />

        <div className="h-4 w-px bg-white/10 mx-1.5" />

        {/* 4. Profile Dropdown (Clean implementation without SidebarMenu) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-full hover:bg-white/5 transition-colors outline-none group/profile">
              <Avatar className="h-7 w-7 rounded-full border border-white/10 group-hover/profile:border-white/20 transition-colors">
                <AvatarImage
                  src={avatarUrl}
                  alt={displayUser.name || displayUser.full_name}
                />
                <AvatarFallback className="rounded-full bg-zinc-800 text-xs text-zinc-400">
                  {displayUser?.name?.slice(0, 2).toUpperCase() || "CN"}
                </AvatarFallback>
              </Avatar>
              {/* Optional: Show name on larger screens or hover? Keep it clean for now */}
              <div className="hidden xl:flex flex-col items-start text-left ml-1">
                <span className="text-[10px] font-medium text-zinc-200 leading-none mb-0.5">
                  {displayUser.name?.split(" ")[0]}
                </span>
                <span className="text-[9px] text-emerald-400 leading-none font-medium">
                  Online
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-56 rounded-2xl shadow-2xl bg-[#09090b]/95 backdrop-blur-xl border-white/10 text-zinc-200 p-1"
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal mb-1">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 m-1">
                <Avatar className="h-9 w-9 rounded-lg border border-white/10">
                  <AvatarImage
                    src={avatarUrl}
                    alt={displayUser.name || displayUser.full_name}
                  />
                  <AvatarFallback className="rounded-lg bg-zinc-800">
                    {displayUser?.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left">
                  <span className="truncate text-sm font-semibold text-white">
                    {displayUser.name || displayUser.full_name}
                  </span>
                  <span className="truncate text-[10px] text-zinc-400">
                    {displayUser.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuGroup className="space-y-0.5 px-1 pb-1">
              <DropdownMenuItem
                asChild
                className="rounded-lg focus:bg-white/10 focus:text-white cursor-pointer"
              >
                <Link href={`${baseUrl}/settings/profile`}>
                  <User className="mr-2 h-4 w-4 text-zinc-400" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="rounded-lg focus:bg-white/10 focus:text-white cursor-pointer"
              >
                <Link href={`${baseUrl}/settings/account`}>
                  <BadgeCheck className="mr-2 h-4 w-4 text-zinc-400" />
                  Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="rounded-lg focus:bg-white/10 focus:text-white cursor-pointer"
              >
                <Link href={`${baseUrl}/settings/appearance`}>
                  <Palette className="mr-2 h-4 w-4 text-zinc-400" />
                  Appearance
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="rounded-lg focus:bg-white/10 focus:text-white cursor-pointer"
              >
                <Link href={`${baseUrl}/settings/notifications`}>
                  <Bell className="mr-2 h-4 w-4 text-zinc-400" />
                  Notifications
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="rounded-lg focus:bg-white/10 focus:text-white cursor-pointer"
              >
                <Link href={`${baseUrl}/settings`}>
                  <Settings className="mr-2 h-4 w-4 text-zinc-400" />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-white/5 mx-2" />

            <DropdownMenuItem className="rounded-lg focus:bg-red-500/10 focus:text-red-400 text-red-500 m-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
