"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  User,
  Settings,
  Bell,
  Palette,
  Shield,
  CreditCard,
} from "lucide-react";

interface SettingsSidebarProps extends React.HTMLAttributes<HTMLElement> {
  farewellId: string;
}

export function SettingsSidebar({
  className,
  farewellId,
  ...props
}: SettingsSidebarProps) {
  const pathname = usePathname();

  const items = [
    {
      title: "Profile",
      href: `/dashboard/${farewellId}/settings/profile`,
      icon: User,
    },
    {
      title: "Account",
      href: `/dashboard/${farewellId}/settings/account`,
      icon: Shield,
    },
    {
      title: "Appearance",
      href: `/dashboard/${farewellId}/settings/appearance`,
      icon: Palette,
    },
    {
      title: "Notifications",
      href: `/dashboard/${farewellId}/settings/notifications`,
      icon: Bell,
    },
    {
      title: "Payments",
      href: `/dashboard/${farewellId}/settings/payments`,
      icon: CreditCard,
    },
  ];

  return (
    <nav
      className={cn(
        "flex space-x-2 overflow-x-auto pb-2 lg:flex-col lg:space-x-0 lg:space-y-1 lg:overflow-visible lg:pb-0",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname === item.href
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline",
            "justify-start whitespace-nowrap"
          )}
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
