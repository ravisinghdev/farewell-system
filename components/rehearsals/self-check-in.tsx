"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { markAttendanceAction } from "@/app/actions/rehearsal-participant-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SelfCheckInProps {
  rehearsalId: string;
  farewellId: string;
  userId: string;
  // In a real app, we'd check geolocation vs rehearsal venue coords
  // For now, it's a simple "I am here" button
  currentStatus: string;
}

export function SelfCheckIn({
  rehearsalId,
  farewellId,
  userId,
  currentStatus,
}: SelfCheckInProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (currentStatus === "present" || currentStatus === "late") {
    return (
      <div className="bg-green-500/10 text-green-600 border border-green-200 rounded-lg p-4 flex items-center justify-center gap-2">
        <CheckCircle2 className="w-5 h-5" />
        <span className="font-medium">You are checked in!</span>
      </div>
    );
  }

  async function handleCheckIn() {
    setLoading(true);
    // Simulate geolocation check
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = await markAttendanceAction(
      rehearsalId,
      farewellId,
      userId,
      "present"
    );
    setLoading(false);

    if (result.error) {
      toast.error("Check-in Failed", { description: result.error });
    } else {
      toast.success("Checked In!", {
        description: "You have verified your attendance.",
      });
      router.refresh();
    }
  }

  return (
    <div className="border rounded-lg p-6 flex flex-col items-center text-center space-y-4 shadow-sm bg-card">
      <div className="bg-primary/10 p-3 rounded-full">
        <MapPin className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-lg">Self Check-In</h3>
        <p className="text-sm text-muted-foreground">
          Confirm your presence at the venue.
        </p>
      </div>
      <Button
        onClick={handleCheckIn}
        disabled={loading}
        className="w-full sm:w-auto min-w-[200px]"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {loading ? "Verifying Location..." : "I'm Here"}
      </Button>
    </div>
  );
}
