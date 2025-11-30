"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export default function DownloadsPage() {
  return (
    <PageScaffold
      title="Downloads"
      description="Important documents and files."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium">Event Schedule.pdf</h4>
              <p className="text-xs text-muted-foreground">
                2.4 MB • Updated yesterday
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded bg-orange-500/10 flex items-center justify-center text-orange-500">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium">Seating Plan.pdf</h4>
              <p className="text-xs text-muted-foreground">
                1.1 MB • Updated 2 days ago
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
    </PageScaffold>
  );
}
