"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { joinOrganizationAction } from "@/features/organizations/org.actions";
import { Link, Mail, KeyRound } from "lucide-react";

export function JoinOrganizationForm() {
  const [state, action, isPending] = useActionState(joinOrganizationAction, undefined);

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <Button variant="outline" className="h-14 justify-start px-4">
          <Link className="mr-4 h-5 w-5 text-muted-foreground" />
          <div className="flex flex-col items-start">
            <span className="font-medium">Join via Invite Link</span>
            <span className="text-xs text-muted-foreground">Click the link sent to your email</span>
          </div>
        </Button>
        <Button variant="outline" className="h-14 justify-start px-4">
          <Mail className="mr-4 h-5 w-5 text-muted-foreground" />
          <div className="flex flex-col items-start">
            <span className="font-medium">Find my Organizations</span>
            <span className="text-xs text-muted-foreground">Search by your email address</span>
          </div>
        </Button>
      </div>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or use a code
          </span>
        </div>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="inviteCode">Invite Code</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="inviteCode" 
              name="inviteCode" 
              className="pl-9"
              required 
              placeholder="e.g. FAREWELL-2026" 
              defaultValue={state?.payload?.inviteCode as string}
            />
          </div>
        </div>
        {state?.error && (
          <p className="text-sm text-destructive font-medium">{state.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Joining..." : "Join Organization"}
        </Button>
      </form>
    </div>
  );
}
