"use client";

import { createContext, useContext, ReactNode } from "react";
import {
  Announcement,
  DashboardStats,
  Highlight,
  TimelineEvent,
} from "@/app/actions/dashboard-actions";

// Define strict interfaces for the context data
export interface DashboardData {
  stats: DashboardStats;
  announcements: Announcement[];
  recentTransactions: any[]; // Replace 'any' with Transaction type when available
  highlights: Highlight[];
  timeline: TimelineEvent[];
  farewellId: string;
}

const DashboardDataContext = createContext<DashboardData | undefined>(
  undefined
);

interface DashboardDataProviderProps extends DashboardData {
  children: ReactNode;
}

export function DashboardDataProvider({
  children,
  stats,
  announcements,
  recentTransactions,
  highlights,
  timeline,
  farewellId,
}: DashboardDataProviderProps) {
  return (
    <DashboardDataContext.Provider
      value={{
        stats,
        announcements,
        recentTransactions,
        highlights,
        timeline,
        farewellId,
      }}
    >
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (context === undefined) {
    throw new Error(
      "useDashboardData must be used within a DashboardDataProvider"
    );
  }
  return context;
}
