"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Shield, UserPlus } from "lucide-react";

export default function PermissionsPage() {
  return (
    <PageScaffold
      title="Access & Roles"
      description="Manage user permissions and administrative access."
      requireAdmin={true}
      action={
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Admin
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-muted/30">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Administrators
            </h3>
          </div>
          <div className="p-0">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div>
                    <p className="font-medium">Admin User {i}</p>
                    <p className="text-xs text-muted-foreground">
                      admin@example.com
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary">
                    Full Access
                  </span>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageScaffold>
  );
}
