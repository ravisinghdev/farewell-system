"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  Menu,
  X,
  Home,
  PiggyBank,
  Image as ImageIcon,
  PartyPopper,
  MessageSquare,
  Settings,
  Sparkles,
} from "lucide-react";

import { useFarewell } from "@/components/providers/farewell-provider";
import { SearchCommand } from "@/components/search-command";
import { NavbarStatsPill } from "@/components/dashboard/navbar-stats-pill";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/theme-toggler";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModernNavbar() {
  const { user, farewell } = useFarewell();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  const farewellId = farewell.id;

  // Handle scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      <SearchCommand open={isSearchOpen} setOpen={setIsSearchOpen} />
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-500",
          scrolled
            ? "bg-background/60 backdrop-blur-2xl border-b border-white/5 shadow-sm supports-[backdrop-filter]:bg-background/40"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 w-full gap-2 sm:gap-4 max-w-full">
          {/* Left Section: Mobile Trigger & Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />

            <div className="hidden md:flex items-center gap-2 px-2">
              <div className="bg-primary/10 p-1.5 rounded-xl">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-sm tracking-tight">
                {farewell.name || "Farewell"}
              </span>
            </div>
          </div>

          {/* Center Section: Navigation (Desktop) - Constrained */}
          <nav className="hidden md:flex items-center gap-1 bg-black/20 p-1 rounded-full border border-white/5 backdrop-blur-md shrink-0 shadow-inner">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== `/dashboard/${farewellId}` &&
                  pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 group",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 bg-white/10 rounded-full border border-white/5 shadow-sm"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <span className="flex items-center gap-2 relative z-10">
                    <item.icon
                      className={cn(
                        "w-3.5 h-3.5 transition-colors",
                        isActive ? "text-primary" : "group-hover:text-primary"
                      )}
                    />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Actions - Constrained */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Search Trigger (Global) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="relative w-9 h-9 rounded-full bg-muted/40 hover:bg-muted/60 text-muted-foreground transition-all group overflow-hidden"
              aria-label="Search"
            >
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Search className="w-4 h-4 group-hover:text-primary transition-colors" />
            </Button>

            <div className="h-6 w-px bg-border/40 mx-1 hidden sm:block" />

            {/* Stats Pill */}
            {farewellId && user?.id && (
              <div className="shrink-0">
                <NavbarStatsPill farewellId={farewellId} userId={user.id} />
              </div>
            )}

            {/* Notifications */}
            <div className="flex items-center gap-1 shrink-0">
              <NotificationBell userId={user?.id} />
              <ThemeToggle />
            </div>

            {/* User Nav */}
            <div className="pl-1 sm:pl-2 shrink-0 mr-1 sm:mr-0">
              <NavUser user={user} farewellId={farewellId} />
            </div>
          </div>
        </div>
      </motion.header>
    </>
  );
}
