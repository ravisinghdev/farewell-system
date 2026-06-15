"use client";

import * as React from "react";
import { ChevronsUpDown, Check, PlusCircle } from "lucide-react";
import { useTransition } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/features/organizations/context/organization-context";
import { switchOrganizationAction } from "@/features/organizations/org.actions";

export function OrganizationSwitcher({
  memberships,
}: {
  memberships: {
    id: string;
    role: string;
    organization: { id: string; name: string; slug: string };
  }[];
}) {
  const { organizationId, organizationName } = useOrganization();
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-50 justify-between"
          disabled={isPending}
        >
          {organizationName || "Select Organization"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-50">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.organization.id}
            onSelect={() => {
              if (membership.organization.id !== organizationId) {
                startTransition(() => {
                  switchOrganizationAction(membership.organization.id);
                });
              }
            }}
          >
            {membership.organization.name}
            {membership.organization.id === organizationId && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => (window.location.href = "/onboarding")}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
