"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle } from "lucide-react";

export default function SupportPage() {
  return (
    <PageScaffold
      title="Support Team"
      description="Get help with the platform or event queries."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Technical Support</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Facing issues with the website or app? Contact our technical team.
          </p>
          <div className="space-y-3">
            <Button className="w-full">
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat with Support
            </Button>
            <Button variant="outline" className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Email Tech Team
            </Button>
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Event Queries</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Questions about the schedule, dress code, or participation?
          </p>
          <div className="space-y-3">
            <Button className="w-full" variant="secondary">
              <MessageCircle className="mr-2 h-4 w-4" />
              Ask Organizers
            </Button>
          </div>
        </div>
      </div>
    </PageScaffold>
  );
}
