"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/supabase";
import { PersonCard } from "./person-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { searchFarewellMembers } from "@/actions/people";

type FarewellRole = Database["public"]["Enums"]["farewell_role"];
type FarewellMember =
  Database["public"]["Tables"]["farewell_members"]["Row"] & {
    user: Database["public"]["Tables"]["users"]["Row"] | null;
  };

interface PeopleGridProps {
  initialMembers: FarewellMember[];
  farewellId: string;
  role: FarewellRole;
}

export function PeopleGrid({
  initialMembers,
  farewellId,
  role,
}: PeopleGridProps) {
  const [members, setMembers] = useState<FarewellMember[]>(initialMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const supabase = createClient();

  // Handle real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`people-${role}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "farewell_members",
          filter: `farewell_id=eq.${farewellId}`,
        },
        async (payload) => {
          // If the change affects our role, refresh the list
          // We could be more granular, but fetching fresh data ensures consistency with joins
          if (
            (payload.new && (payload.new as any).role === role) ||
            (payload.old && (payload.old as any).role === role)
          ) {
            // Re-fetch members
            // Note: In a production app, we might want to optimistically update or fetch only the changed row
            // But for simplicity and correctness with joins, we'll trigger a search/refresh
            if (!searchQuery) {
              // We can't easily call the server action here without making it a client component that calls server action
              // But we are in a client component.
              // Let's just re-run the search with empty query to get all
              const freshData = await searchFarewellMembers(
                farewellId,
                "",
                role
              );
              setMembers(freshData as FarewellMember[]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, role, supabase, searchQuery]);

  // Handle search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchFarewellMembers(
          farewellId,
          searchQuery,
          role
        );
        setMembers(results as FarewellMember[]);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, farewellId, role]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={`Search ${role}s...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {members.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No {role}s found</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            {searchQuery
              ? `No results found for "${searchQuery}"`
              : `There are no ${role}s in this farewell yet.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((member) => (
            <PersonCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
