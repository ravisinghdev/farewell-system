"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createOrganizationAction } from "@/features/organizations/org.actions";

export function CreateOrganizationForm({ hasMemberships }: { hasMemberships: boolean }) {
  const [state, action, isPending] = useActionState(createOrganizationAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Organization Name</Label>
        <Input 
          id="name" 
          name="name" 
          required 
          placeholder="e.g. Acme Corp" 
          defaultValue={state?.payload?.name as string}
        />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive font-medium">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending 
          ? "Creating..." 
          : hasMemberships 
            ? "Create Another Organization" 
            : "Create Organization"
        }
      </Button>
    </form>
  );
}
