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

import { SidebarChatList } from "@/components/chat/sidebar-chat-list";

import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";

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
          href: "/dashboard/announcements",
          label: "Announcements",
          icon: Bell,
        },
        {
          href: "/dashboard/timeline",
          label: "Farewell Timeline",
          icon: CalendarDays,
        },
        {
          href: "/dashboard/highlights",
          label: "Highlights & Updates",
          icon: Star,
        },
      ],
    },

    /* ------------------- CONTRIBUTIONS ------------------- */
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
          href: "/dashboard/contributions/history",
          label: "Payment History",
          icon: FolderClock,
        },
        {
          href: "/dashboard/contributions/analytics",
          label: "Analytics & Insights",
          icon: LineChart,
        },
        {
          href: "/dashboard/contributions/leaderboard",
          label: "Top Contributors",
          icon: Trophy,
        },
        {
          href: "/dashboard/budget",
          label: "Budget & Expenses",
          icon: Wallet,
        },
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

    /* ------------------- CONNECTIONS ------------------- */
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

    /* ------------------- PEOPLE ------------------- */
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
      ],
    },

    /* ------------------- EVENTS ------------------- */
    {
      title: "Events",
      items: [
        {
          href: "/dashboard/farewell-event",
          label: "Main Farewell Event",
          icon: PartyPopper,
        },
        {
          href: "/dashboard/rehearsals",
          label: "Rehearsals & Planning",
          icon: ClipboardList,
        },
        {
          href: "/dashboard/performances",
          label: "Performances & Acts",
          icon: Music,
        },
        {
          href: "/dashboard/decor",
          label: "Decoration & Setup",
          icon: Palette,
        },
        {
          href: "/dashboard/tasks",
          label: "Event Task Board",
          icon: ListChecks,
        },
      ],
    },

    /* ------------------- LEGACY ------------------- */
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

    /* ------------------- MANAGEMENT ------------------- */
    {
      title: "Management",
      items: [
        {
          href: "/dashboard/committees",
          label: "Organizing Committees",
          icon: ClipboardCheck,
        },
        {
          href: "/dashboard/duties",
          label: "Duties & Assignments",
          icon: ClipboardList,
        },
        {
          href: "/dashboard/permissions",
          label: "Access & Roles",
          icon: Shield,
        },
        {
          href: "/dashboard/settings",
          label: "Admin Settings",
          icon: Settings,
        },
        {
          href: "/dashboard/activity",
          label: "System Activity",
          icon: Activity,
        },
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
      className="border-r backdrop-blur-md z-50"
    >
      <SidebarHeader>
        <FarewellHeader name={farewellName} year={farewellYear} />
      </SidebarHeader>
      <SidebarContent>
        {/* Chat List Integration with Message Links */}
        {/* Chat List Integration with Message Links - DISABLED */}
        {/* <SidebarChatList farewellId={farewellId} currentUserId={user.id}>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Farewell Messages">
              <Link href={p("/dashboard/messages")}>
                <MessageSquare />
                <span>Farewell Messages</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Letters to Seniors">
              <Link href={p("/dashboard/letters")}>
                <Mail />
                <span>Letters to Seniors</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Alumni Messages">
              <Link href={p("/dashboard/alumni")}>
                <UserCircle />
                <span>Alumni Messages</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Feedback & Suggestions">
              <Link href={p("/dashboard/feedback")}>
                <MessageSquareHeart />
                <span>Feedback & Suggestions</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarChatList> */}

        {navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <Link href={p(item.href)}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>{/* NavUser moved to Top Navbar */}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
