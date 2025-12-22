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
  GalleryVerticalEnd,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Image,
  Info,
  LayoutTemplate,
  LifeBuoy,
  ListChecks,
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
  Star,
  Trophy,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  disabledTooltip?: string;
  adminOnly?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
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
      {
        href: "/dashboard/budget",
        label: "Budget & Expenses",
        icon: Wallet,
        adminOnly: true,
      },
      {
        href: "/dashboard/contributions/manage",
        label: "Manage Contributions",
        icon: Shield,
        adminOnly: true,
      },
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
        disabled: true,
        disabledTooltip: "Coming Soon",
      },
      {
        href: "/dashboard/settings",
        label: "Settings",
        icon: Settings,
      },
      {
        href: "/dashboard/permissions",
        label: "Access & Roles",
        icon: Shield,
        adminOnly: true,
        disabled: true,
        disabledTooltip: "Coming Soon",
      },
      {
        href: "/dashboard/activity",
        label: "System Activity",
        icon: Activity,
        adminOnly: true,
        disabled: true,
        disabledTooltip: "Coming Soon",
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

  /* ------------------- PEOPLE (Secondary) ------------------- */
  {
    title: "People",
    items: [
      {
        href: "/dashboard/students",
        label: "12th Grade Students",
        icon: Users,
        disabled: true,
        disabledTooltip: "Coming Soon",
      },
      {
        href: "/dashboard/teachers",
        label: "Teachers & Mentors",
        icon: GraduationCap,
        disabled: true,
        disabledTooltip: "Coming Soon",
      },
      {
        href: "/dashboard/juniors",
        label: "Junior Contributors",
        icon: User,
        disabled: true,
        disabledTooltip: "Coming Soon",
      },
      {
        href: "/dashboard/organizers",
        label: "Farewell Giving Class",
        icon: Users,
        disabled: true,
        disabledTooltip: "Coming Soon",
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
        disabled: true,
        disabledTooltip: "Coming Soon",
      },
      {
        href: "/dashboard/artworks",
        label: "Art & Creative Works",
        icon: Brush,
        disabled: true,
        disabledTooltip: "Coming Soon",
      },
      {
        href: "/dashboard/yearbook",
        label: "Digital Yearbook",
        icon: BookOpen,
        disabled: true,
        disabledTooltip: "Coming Soon",
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
        disabled: true,
        disabledTooltip: "Coming Soon",
      },
      {
        href: "/dashboard/farewell-video",
        label: "Farewell Film",
        icon: Film,
        disabled: true,
        disabledTooltip: "Coming Soon",
      },
      {
        href: "/dashboard/gift-wall",
        label: "Gift & Wishes Wall",
        icon: Gift,
        disabled: true,
        disabledTooltip: "Coming Soon",
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
