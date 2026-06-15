"use client";

import * as React from "react";
import { GalleryVerticalEnd } from "lucide-react";
import { Logo } from "@/components/ui/logo";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function FarewellHeader({
  name,
  year,
}: {
  name: string;
  year: string | number;
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="group data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-default hover:bg-transparent"
        >
          <Logo
            size="sm"
            className="shadow-lg shadow-primary/25 transition-transform group-hover:scale-105"
          />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-bold tracking-tight">{name}</span>
            <span className="truncate text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              Class of {year}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
