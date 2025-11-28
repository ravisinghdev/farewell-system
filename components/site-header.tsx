"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";
import { NavUser } from "@/components/nav-user";

interface SiteHeaderProps {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <DashboardBreadcrumb />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <NavUser user={user} />
      </div>
    </header>
  );
}
