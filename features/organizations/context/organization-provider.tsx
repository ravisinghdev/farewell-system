"use client";

import { ReactNode } from "react";
import { OrganizationContext, OrganizationContextValue } from "./organization-context";

export function OrganizationProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: OrganizationContextValue;
}) {
  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
