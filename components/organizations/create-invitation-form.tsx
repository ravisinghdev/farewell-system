"use client";

import { useActionState, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createInvitationAction } from "@/features/organizations/org.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Copy } from "lucide-react";

export function CreateInvitationForm({ organizationId }: { organizationId: string }) {
  const [state, action, isPending] = useActionState(createInvitationAction, undefined);
  const [copied, setCopied] = useState(false);

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (state?.success && state.token) {
    return (
      <div className="space-y-4 p-4 border rounded-md bg-muted/50">
        <div className="space-y-1">
          <h4 className="font-medium text-sm">Invitation Created</h4>
          <p className="text-sm text-muted-foreground">Share this code or link with the member.</p>
        </div>
        <div className="flex gap-2">
          <Input readOnly value={state.token} className="font-mono" />
          <Button variant="outline" size="icon" onClick={() => handleCopy(state.token)}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex gap-2">
          <Input readOnly value={`${window.location.origin}/join/${state.token}`} className="font-mono text-xs" />
          <Button variant="outline" size="icon" onClick={() => handleCopy(`${window.location.origin}/join/${state.token}`)}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address (Optional)</Label>
          <Input 
            id="email" 
            name="email" 
            type="email"
            placeholder="e.g. member@example.com" 
            defaultValue={state?.payload?.email as string}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select name="role" defaultValue="Member">
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Member">Member</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive font-medium">{state.error}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Generating..." : "Generate Invite Link"}
      </Button>
    </form>
  );
}
