"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Activity } from "lucide-react";

export default function ActivityPage() {
  return (
    <PageScaffold
      title="System Activity"
      description="Log of recent actions and changes in the system."
      requireAdmin={true}
    >
      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-emerald-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <Activity className="w-5 h-5" />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 shadow">
              <div className="flex items-center justify-between space-x-2 mb-1">
                <div className="font-bold text-slate-900">New Announcement</div>
                <time className="font-caveat font-medium text-indigo-500">
                  12:0{i} PM
                </time>
              </div>
              <div className="text-slate-500">
                Admin posted "Important Update regarding Rehearsals"
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageScaffold>
  );
}
