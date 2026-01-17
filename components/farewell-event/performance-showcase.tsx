"use client";

import { useState, useMemo } from "react";
import { Performance } from "@/types/performance";
import { PerformanceCard } from "@/components/performances/performance-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Mic2, Music, Crown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PerformanceShowcaseProps {
  performances: Performance[];
  isAdmin: boolean;
  onEdit: (p: Performance) => void;
  onDelete: (id: string) => void;
  onToggleLock: (id: string, current: boolean) => void;
  onApprove: (id: string) => void;
  onVote?: (id: string) => void;
  userVotes?: Set<string>; // IDs of performances the user voted for
}

export function PerformanceShowcase({
  performances,
  isAdmin,
  onEdit,
  onDelete,
  onToggleLock,
  onApprove,
  onVote,
  userVotes,
}: PerformanceShowcaseProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"sequence" | "created" | "title">(
    "sequence"
  );

  const filteredPerformances = useMemo(() => {
    return performances
      .filter((p) => {
        const matchesSearch = p.title
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesType = filterType === "all" || p.type === filterType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === "sequence")
          return (a.sequence_order || 999) - (b.sequence_order || 999);
        if (sortBy === "created")
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        return a.title.localeCompare(b.title);
      });
  }, [performances, search, filterType, sortBy]);

  const categories = Array.from(new Set(performances.map((p) => p.type)));

  return (
    <div className="space-y-6">
      {/* Filters & Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
        <div className="relative w-full md:w-auto md:min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search acts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 border-white/20"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <Button
            variant={filterType === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilterType("all")}
            className="whitespace-nowrap"
          >
            All Acts
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={filterType === cat ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilterType(cat)}
              className="whitespace-nowrap capitalize"
            >
              {cat.replace("_", " ")}
            </Button>
          ))}
        </div>

        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-[140px] border-white/20 bg-background/50">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sequence">Sequence</SelectItem>
            <SelectItem value="created">Newest</SelectItem>
            <SelectItem value="title">A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPerformances.map((perf) => (
          <div key={perf.id} className="group relative">
            <PerformanceCard
              performance={perf}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleLock={onToggleLock}
              onApprove={onApprove}
            />

            {!isAdmin && onVote && (
              <div className="absolute top-4 right-4 z-10">
                <Button
                  size="icon"
                  variant={userVotes?.has(perf.id) ? "default" : "secondary"}
                  className={cn(
                    "rounded-full shadow-lg transition-all",
                    userVotes?.has(perf.id)
                      ? "bg-pink-500 hover:bg-pink-600 text-white"
                      : "bg-white/80 hover:bg-white text-pink-500"
                  )}
                  onClick={() => onVote(perf.id)}
                >
                  <Crown
                    className={cn(
                      "w-5 h-5",
                      userVotes?.has(perf.id) && "fill-current"
                    )}
                  />
                </Button>
              </div>
            )}
          </div>
        ))}

        {filteredPerformances.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No performances found matching your criteria</p>
            <Button
              variant="link"
              onClick={() => {
                setSearch("");
                setFilterType("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
