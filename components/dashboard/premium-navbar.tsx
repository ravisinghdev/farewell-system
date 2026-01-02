"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Home,
  PiggyBank,
  Image as ImageIcon,
  PartyPopper,
  MessageSquare,
  Sparkles,
  Menu,
} from "lucide-react";

import { useFarewell } from "@/components/providers/farewell-provider";
import { SearchCommand } from "@/components/search-command";
import { NavbarStatsPill } from "@/components/dashboard/navbar-stats-pill";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/theme-toggler";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UnifiedUserCapsule } from "@/components/dashboard/unified-user-capsule";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PremiumNavbar() {
  const { user, farewell } = useFarewell();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const pathname = usePathname();
  const farewellId = farewell.id;

  const navItems = [
    { icon: Home, label: "Home", href: `/dashboard/${farewellId}` },
    {
      icon: PiggyBank,
      label: "Pay",
      href: `/dashboard/${farewellId}/contributions`,
    },
    {
      icon: ImageIcon,
      label: "Gallery",
      href: `/dashboard/${farewellId}/memories`,
    },
    {
      icon: PartyPopper,
      label: "Event",
      href: `/dashboard/${farewellId}/farewell-event`,
    },
    {
      icon: MessageSquare,
      label: "Chat",
      href: `/dashboard/${farewellId}/messages`,
    },
  ];

  return (
    <>
      {/* Floating Nano-Bar Container */}
      <header className="sticky top-4 z-40 w-full px-4 md:px-6 pointer-events-none flex justify-center">
        <div className="w-full max-w-7xl flex items-center justify-between pointer-events-auto relative bg-background/80 backdrop-blur-2xl border border-border/50 rounded-full p-2 shadow-2xl transition-all duration-300">
          {/* Left: Branding & Trigger */}
          <div className="flex items-center gap-3 pl-2 pr-4 shrink-0 z-20">
            <SidebarTrigger className="h-9 w-9 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" />
            <div className="h-5 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2 hidden sm:flex">
              <span className="font-semibold text-sm text-foreground tracking-tight">
                {farewell.name}
              </span>
            </div>
          </div>

          {/* Center: Navigation Dock (Fluid) */}
          <div className="hidden lg:flex items-center justify-center gap-1 z-10 w-auto mx-auto bg-muted/40 rounded-full p-1 border border-border/20 shadow-inner">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 group flex items-center gap-2",
                    isActive
                      ? "text-primary-foreground bg-primary shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110",
                      isActive && "text-primary-foreground"
                    )}
                  />
                  <span className="relative z-10 hidden xl:inline">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Right: Unified Action Capsule (Transparent) */}
          <UnifiedUserCapsule user={user} farewellId={farewellId} />
        </div>
      </header>
    </>
  );
}
