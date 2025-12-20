"use client";

import * as React from "react";
import {
  Activity,
  Bell,
  BookOpen,
  Brush,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Download,
  Film,
  FolderClock,
  GalleryVerticalEnd,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Image,
  Info,
  LayoutTemplate,
  LifeBuoy,
  LineChart,
  ListChecks,
  Mail,
  MessageSquare,
  MessageSquareHeart,
  Music,
  Music2,
  Palette,
  PartyPopper,
  PiggyBank,
  Plus,
  Quote,
  ReceiptText,
  Settings,
  Shield,
  SquareTerminal,
  Star,
  Trophy,
  User,
  UserCircle,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { FarewellHeader } from "@/components/farewell-header";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Added for active state

import { SidebarChatList } from "@/components/chat/sidebar-chat-list";

import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { cn } from "@/lib/utils"; // Ensure you have this utility or use standard class string

// Define types for the props
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  // Props are now optional/unused as we use context
  user?: any;
  farewellId?: string;
  farewellName?: string;
  farewellYear?: string | number;
  role?: string;
}

export function AppSidebar({
  user: propUser,
  farewellId: propFarewellId,
  farewellName: propFarewellName,
  farewellYear: propFarewellYear,
  role: propRole,
  ...props
}: AppSidebarProps) {
  const { user, farewell } = useFarewell();
  const pathname = usePathname();

  const farewellId = farewell.id;
  const farewellName = farewell.name;
  const farewellYear = farewell.year;
  const role = farewell.role;
  // Helper to prefix links
  const p = (path: string) => {
    // If path is exactly /dashboard, append ID.
    // If path is /dashboard/something, insert ID: /dashboard/[id]/something
    if (path === "/dashboard") return `/dashboard/${farewellId}`;
    return path.replace("/dashboard", `/dashboard/${farewellId}`);
  };

  const navGroups = [
    {
      title: "Overview",
      items: [
        { href: "/dashboard", label: "Home", icon: Home },
        {
          href: "/dashboard/timeline",
          label: "Farewell Timeline",
          icon: CalendarDays,
        },
        {
          href: "/dashboard/announcements",
          label: "Announcements",
          icon: Bell,
        },
        {
          href: "/dashboard/highlights",
          label: "Highlights & Updates",
          icon: Star,
        },
      ],
    },

    /* ------------------- EVENTS (High Priority) ------------------- */
    {
      title: "Events & Planning",
      items: [
        {
          href: "/dashboard/rehearsals",
          label: "Rehearsals & Planning",
          icon: ClipboardList,
        },
        {
          href: "/dashboard/tasks",
          label: "Event Task Board",
          icon: ListChecks,
        },
        {
          href: "/dashboard/decor",
          label: "Decoration & Setup",
          icon: Palette,
        },
        {
          href: "/dashboard/performances",
          label: "Performances & Acts",
          icon: Music,
        },
        {
          href: "/dashboard/farewell-event",
          label: "Main Farewell Event",
          icon: PartyPopper,
        },
      ],
    },

    /* ------------------- CONTRIBUTIONS (High Priority) ------------------- */
    {
      title: "Contributions",
      items: [
        {
          href: "/dashboard/contributions",
          label: "Main Dashboard",
          icon: PiggyBank,
        },
        {
          href: "/dashboard/contributions/payment",
          label: "Make Payment",
          icon: Plus,
        },
        {
          href: "/dashboard/contributions/receipt",
          label: "Receipts & Downloads",
          icon: ReceiptText,
        },
        {
          href: "/dashboard/contributions/leaderboard",
          label: "Top Contributors",
          icon: Trophy,
        },
        ...(checkIsAdmin(role)
          ? [
              {
                href: "/dashboard/budget",
                label: "Budget & Expenses",
                icon: Wallet,
              },
            ]
          : []),
        ...(checkIsAdmin(role)
          ? [
              {
                href: "/dashboard/contributions/manage",
                label: "Manage Contributions",
                icon: Shield,
              },
            ]
          : []),
      ],
    },

    /* ------------------- MANAGEMENT (Admin Tools) ------------------- */
    {
      title: "Management",
      items: [
        {
          href: "/dashboard/duties",
          label: "Duties & Assignments",
          icon: ClipboardList,
        },
        {
          href: "/dashboard/committees",
          label: "Organizing Committees",
          icon: ClipboardCheck,
        },
        {
          href: "/dashboard/settings",
          label: "Settings",
          icon: Settings,
        },
        ...(checkIsAdmin(role)
          ? [
              {
                href: "/dashboard/permissions",
                label: "Access & Roles",
                icon: Shield,
              },

              {
                href: "/dashboard/activity",
                label: "System Activity",
                icon: Activity,
              },
            ]
          : []),
      ],
    },

    /* ------------------- RESOURCES ------------------- */
    {
      title: "Resources",
      items: [
        {
          href: "/dashboard/templates",
          label: "Templates & Designs",
          icon: LayoutTemplate,
        },
        {
          href: "/dashboard/music-library",
          label: "Music & Backgrounds",
          icon: Music2,
        },
        { href: "/dashboard/downloads", label: "Downloads", icon: Download },
      ],
    },

    /* ------------------- PEOPLE (Secondary) ------------------- */
    {
      title: "People",
      items: [
        {
          href: "/dashboard/students",
          label: "12th Grade Students",
          icon: Users,
        },
        {
          href: "/dashboard/teachers",
          label: "Teachers & Mentors",
          icon: GraduationCap,
        },
        {
          href: "/dashboard/juniors",
          label: "Junior Contributors",
          icon: User,
        },
        {
          href: "/dashboard/organizers",
          label: "Farewell Giving Class",
          icon: Users,
        },
      ],
    },

    /* ------------------- CONNECTIONS (Secondary) ------------------- */
    {
      title: "Connections",
      items: [
        {
          href: "/dashboard/memories",
          label: "Photo & Video Gallery",
          icon: Image,
        },
        {
          href: "/dashboard/artworks",
          label: "Art & Creative Works",
          icon: Brush,
        },
        {
          href: "/dashboard/yearbook",
          label: "Digital Yearbook",
          icon: BookOpen,
        },
      ],
    },

    /* ------------------- LEGACY (Reference) ------------------- */
    {
      title: "Legacy",
      items: [
        {
          href: "/dashboard/quotes",
          label: "Best Quotes & Memories",
          icon: Quote,
        },
        {
          href: "/dashboard/farewell-video",
          label: "Farewell Film",
          icon: Film,
        },
        {
          href: "/dashboard/gift-wall",
          label: "Gift & Wishes Wall",
          icon: Gift,
        },
        { href: "/dashboard/thankyou", label: "Thank You Notes", icon: Heart },
      ],
    },

    /* ------------------- COMMUNITY ------------------- */
    {
      title: "Community",
      items: [
        { href: "/dashboard/support", label: "Support Team", icon: LifeBuoy },
        {
          href: "/dashboard/about",
          label: "About Farewell Project",
          icon: Info,
        },
      ],
    },
  ];

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className="border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl z-50 shadow-2xl"
    >
      <SidebarHeader className="pb-4 pt-4">
        <FarewellHeader name={farewellName} year={farewellYear} />
      </SidebarHeader>

      <SidebarContent className="px-2">
        {navGroups.map((group) => (
          <SidebarGroup key={group.title} className="py-2">
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/70 mb-1">
              {group.title}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const fullPath = p(item.href);
                const isActive = pathname === fullPath;

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      className={cn(
                        "relative transition-all duration-200 ease-in-out group/item overflow-hidden",
                        isActive
                          ? "bg-primary/15 text-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:bg-primary/20 hover:text-primary"
                          : "text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:translate-x-1"
                      )}
                    >
                      <Link
                        href={fullPath}
                        className="flex items-center gap-3 py-2"
                      >
                        {/* Active Indicator Bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
                        )}

                        <item.icon
                          className={cn(
                            "h-4 w-4 transition-transform group-hover/item:scale-110",
                            isActive && "text-primary"
                          )}
                        />
                        <span className="font-medium text-sm tracking-tight">
                          {item.label}
                        </span>

                        {/* Hover Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sidebar-accent/10 to-transparent -translate-x-full group-hover/item:translate-x-full transition-transform duration-700 pointer-events-none" />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>{/* NavUser moved to Top Navbar */}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
