"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDutiesAction } from "@/actions/duties";
import { createClient } from "@/utils/supabase/client";
import { DutyCard } from "@/components/duties/duty-card";
import { CreateDutyDialog } from "@/components/duties/create-duty-dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRealtimeDuties } from "@/hooks/use-realtime-duties";

import { useFarewell } from "@/components/providers/farewell-provider";

export default function DutiesPage() {
  const { user, farewell } = useFarewell();
  const farewellId = farewell.id;
  const currentUserId = user.id;
  const isFarewellAdmin = ["admin", "parallel_admin", "main_admin"].includes(
    farewell.role || ""
  );

  const [duties, setDuties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDuties = async () => {
    try {
      const data = await getDutiesAction(farewellId);
      setDuties(data || []);
    } catch (error) {
      toast.error("Failed to load duties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (farewellId) {
      fetchDuties();
    }
  }, [farewellId]);

  useRealtimeDuties(farewellId, fetchDuties);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Duties & Tasks</h1>
          <p className="text-muted-foreground">
            Manage responsibilities and track expenses.
          </p>
        </div>
        {isFarewellAdmin && (
          <CreateDutyDialog farewellId={farewellId} onSuccess={fetchDuties} />
        )}
      </div>

      {duties.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/10">
          <h3 className="text-lg font-medium">No duties found</h3>
          <p className="text-muted-foreground">
            {isFarewellAdmin
              ? "Create a duty to get started."
              : "No duties have been assigned yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {duties.map((duty) => (
            <DutyCard key={duty.id} duty={duty} onUpdate={fetchDuties} />
          ))}
        </div>
      )}
    </div>
  );
}
