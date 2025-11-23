// app/dashboard/welcome/welcome-realtime.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import type { FarewellRow } from "./page";
import type { UserRole } from "@/lib/auth/roles";

import { supabaseClient } from "@/utils/supabase/client"; // your browser supabase client
import { joinFarewellFormAction } from "@/app/actions/farewell-join-actions";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface WelcomeRealtimeProps {
  initialFarewells: FarewellRow[];
  userRole: UserRole;
}

export default function WelcomeRealtime({
  initialFarewells,
  userRole,
}: WelcomeRealtimeProps) {
  const [farewells, setFarewells] = useState<FarewellRow[] | null>(
    initialFarewells
  );
  const [selectedFarewell, setSelectedFarewell] = useState<string>("");
  const [isHydrating, setIsHydrating] = useState<boolean>(false);

  // Realtime subscription
  useEffect(() => {
    const channel = supabaseClient
      .channel("farewells-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "farewells",
        },
        (payload) => {
          setFarewells((current) => {
            const currentList = current ?? [];
            const { eventType } = payload;

            if (eventType === "INSERT") {
              const newRow = payload.new as FarewellRow;
              toast.success("New farewell added", {
                description: `${newRow.name} — ${newRow.section ?? ""}, ${
                  newRow.year
                }`,
              });

              const updated = [...currentList, newRow].sort(
                (a, b) => b.year - a.year
              );
              // Auto-select new farewell if nothing chosen yet
              if (!selectedFarewell) {
                setSelectedFarewell(newRow.id);
              }
              return updated;
            }

            if (eventType === "UPDATE") {
              const updatedRow = payload.new as FarewellRow;
              toast("Farewell updated", {
                description: `${updatedRow.name} — ${
                  updatedRow.section ?? ""
                }, ${updatedRow.year}`,
              });

              return currentList
                .map((fw) => (fw.id === updatedRow.id ? updatedRow : fw))
                .sort((a, b) => b.year - a.year);
            }

            if (eventType === "DELETE") {
              const oldRow = payload.old as FarewellRow;
              toast("Farewell removed", {
                description: `${oldRow.name} — ${oldRow.section ?? ""}, ${
                  oldRow.year
                }`,
              });

              const filtered = currentList.filter((fw) => fw.id !== oldRow.id);
              // Clear selection if deleted was selected
              if (selectedFarewell === oldRow.id) {
                setSelectedFarewell("");
              }
              return filtered;
            }

            return currentList;
          });
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [selectedFarewell]);

  // Optional: small hydration flag if you want to show a skeleton on mount
  useEffect(() => {
    if (!farewells) {
      setIsHydrating(true);
      const timer = setTimeout(() => setIsHydrating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [farewells]);

  const isEmpty = !farewells || farewells.length === 0;

  const headingText =
    userRole === "parallel_admin" || userRole === "main_admin"
      ? "Assign Yourself to a Farewell"
      : "Choose Your Farewell";

  const subText =
    userRole === "parallel_admin" || userRole === "main_admin"
      ? "Select the farewell batch you are administrating. You can manage other batches from the admin area."
      : "Select the farewell batch you belong to. If approval is required, an admin will review your request.";

  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-semibold">{headingText}</h1>
        <p className="text-gray-600 text-sm">{subText}</p>
      </div>

      {isHydrating && (
        <div className="space-y-3">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-1/2" />
        </div>
      )}

      {!isHydrating && isEmpty && (
        <p className="text-gray-600">No farewells found. Contact your admin.</p>
      )}

      {!isHydrating && !isEmpty && (
        <AnimatePresence mode="wait">
          <motion.div
            key={farewells?.length ?? 0}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            <form action={joinFarewellFormAction} className="space-y-6">
              <div className="space-y-2">
                <Label className="font-medium">Select Farewell</Label>

                <Select
                  onValueChange={(v) => setSelectedFarewell(v)}
                  value={selectedFarewell || undefined}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose a farewell batch" />
                  </SelectTrigger>

                  <SelectContent>
                    {farewells!.map((fw) => (
                      <SelectItem key={fw.id} value={fw.id}>
                        {fw.name} — {fw.section ?? ""}, {fw.year}
                        {fw.requires_approval ? " (Needs Approval)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Hidden input so server action receives the selected farewell */}
                <input
                  type="hidden"
                  name="farewellId"
                  value={selectedFarewell}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={!selectedFarewell}
              >
                Join Farewell
              </Button>
            </form>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
