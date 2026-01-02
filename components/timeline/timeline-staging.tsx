"use client";

import { useTimeline } from "@/components/providers/timeline-provider";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function TimelineStaging() {
  const { availablePerformances, addPerformanceToTimeline } = useTimeline();
  const [search, setSearch] = useState("");

  const filtered = availablePerformances.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.lead_coordinator?.full_name
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <Card className="h-full border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg font-semibold">Staging Area</CardTitle>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {availablePerformances.length} Left
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search acts..."
            className="pl-9 bg-card/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>

      <CardContent className="px-0 overflow-y-auto h-[calc(100vh-280px)] space-y-2 pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="group flex items-center justify-between p-3 rounded-xl border bg-card hover:border-primary/50 transition-colors shadow-sm"
            >
              <div className="flex-1 min-w-0 mr-3">
                <h4 className="font-medium text-sm truncate" title={p.title}>
                  {p.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 rounded-sm border-muted-foreground/30 text-muted-foreground"
                  >
                    {p.type}
                  </Badge>
                  {p.duration_seconds && (
                    <span className="text-[10px] text-muted-foreground">
                      {Math.floor(p.duration_seconds / 60)}m
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                onClick={() => addPerformanceToTimeline(p)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            {availablePerformances.length === 0
              ? "All acts scheduled! 🎉"
              : "No acts found."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}




