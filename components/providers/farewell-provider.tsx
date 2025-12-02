"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import {
  UserRole,
  Permission,
  getPermissionsForRole,
  hasPermission,
} from "@/lib/auth/roles";

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
  permissions: Permission[];
  isAdmin: boolean;
}

const FarewellContext = createContext<FarewellContextType | undefined>(
  undefined
);

interface FarewellProviderProps {
  children: ReactNode;
  user: FarewellContextType["user"];
  farewell: Omit<FarewellContextType["farewell"], "role"> & { role: UserRole };
}

export function FarewellProvider({
  children,
  user,
  farewell,
}: FarewellProviderProps) {
  const contextValue = useMemo(() => {
    const permissions = getPermissionsForRole(farewell.role);
    const isAdmin = ["admin", "main_admin", "parallel_admin"].includes(
      farewell.role
    );

    return {
      user,
      farewell,
      permissions,
      isAdmin,
    };
  }, [user, farewell]);

  return (
    <FarewellContext.Provider value={contextValue}>
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

export function useFarewellRole() {
  const { farewell } = useFarewell();
  return farewell.role;
}

export function useFarewellPermissions() {
  const { permissions } = useFarewell();
  return permissions;
}

export function useIsAdmin() {
  const { isAdmin } = useFarewell();
  return isAdmin;
}

export function useHasPermission(permission: Permission) {
  const { farewell } = useFarewell();
  return hasPermission(farewell.role, permission);
}
