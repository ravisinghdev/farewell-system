"use client";

import { createContext, useContext, ReactNode } from "react";
import { UserRole } from "@/lib/auth/roles";

interface FarewellContextType {
  user: {
    id: string;
    email?: string;
    name: string;
    avatar: string;
    username?: string;
  };
  farewell: {
    id: string;
    name: string;
    year: string | number;
    role: UserRole;
  };
}

const FarewellContext = createContext<FarewellContextType | undefined>(
  undefined
);

interface FarewellProviderProps extends FarewellContextType {
  children: ReactNode;
}

export function FarewellProvider({
  children,
  user,
  farewell,
}: FarewellProviderProps) {
  return (
    <FarewellContext.Provider value={{ user, farewell }}>
      {children}
    </FarewellContext.Provider>
  );
}

export function useFarewell() {
  const context = useContext(FarewellContext);
  if (context === undefined) {
    throw new Error("useFarewell must be used within a FarewellProvider");
  }
  return context;
}
