"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Settings,
  Users,
  Shield,
  CreditCard,
  ClipboardList,
  MessageSquare,
  Bell,
  Image as ImageIcon,
  FlaskConical,
} from "lucide-react";

interface SettingsNavProps {
  farewellId: string;
}

export function SettingsNav({ farewellId }: SettingsNavProps) {
  const pathname = usePathname();

  const links = [
    {
      title: "General",
      href: `/dashboard/${farewellId}/settings/general`,
      icon: Settings,
    },
    {
      title: "Roles",
      href: `/dashboard/${farewellId}/settings/roles`,
      icon: Shield,
    },
    {
      title: "Joining",
      href: `/dashboard/${farewellId}/settings/joining`,
      icon: Users,
    },
    {
      title: "Finance",
      href: `/dashboard/${farewellId}/settings/finance`,
      icon: CreditCard,
    },
    {
      title: "Duties",
      href: `/dashboard/${farewellId}/settings/duties`,
      icon: ClipboardList,
    },
    {
      title: "Comm",
      href: `/dashboard/${farewellId}/settings/communication`,
      icon: MessageSquare,
    },
    {
      title: "Gallery",
      href: `/dashboard/${farewellId}/settings/gallery`,
      icon: ImageIcon,
    },
    {
      title: "Notifs",
      href: `/dashboard/${farewellId}/settings/notifications`,
      icon: Bell,
    },
    {
      title: "Advanced",
      href: `/dashboard/${farewellId}/settings/advanced`,
      icon: FlaskConical,
    },
    {
      title: "Profile",
      href: `/dashboard/${farewellId}/settings/profile`,
      icon: Users,
    },
  ];

  return (
    <div className="hidden sm:block fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center gap-1 p-2 bg-white/80 dark:bg-black/40 w-fit max-w-full overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10 backdrop-blur-xl shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/5 no-scrollbar">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;

          return (
            <Link key={link.href} href={link.href} className="relative z-10">
              <span
                className={cn(
                  "relative z-10 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap",
                  isActive
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-400 dark:text-white/40"
                  )}
                />
                {isActive && (
                  <span className="animate-in fade-in zoom-in duration-300 hidden sm:inline">
                    {link.title}
                  </span>
                )}
              </span>

              {isActive && (
                <motion.div
                  layoutId="active-pill-settings"
                  className="absolute inset-0 bg-white dark:bg-white/10 border border-zinc-200 dark:border-white/10 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
