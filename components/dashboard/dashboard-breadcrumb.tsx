"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

export function DashboardBreadcrumb() {
  const pathname = usePathname();

  const segments = pathname
    .split("/")
    .filter(Boolean)
    .filter((seg) => seg !== "dashboard");

  const pretty = (seg: string) =>
    seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Breadcrumb>
      <BreadcrumbList aria-label="Breadcrumb">
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>

        {segments.map((seg, idx) => {
          // Skip if segment looks like a UUID
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              seg
            );
          if (isUuid) return null;

          const href = "/dashboard/" + segments.slice(0, idx + 1).join("/");
          const isLast = idx === segments.length - 1;

          return (
            <React.Fragment key={seg + idx}>
              <BreadcrumbSeparator
                className={idx === 0 ? "hidden md:block" : ""}
              />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{pretty(seg)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href} className="hidden md:block">
                    {pretty(seg)}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
