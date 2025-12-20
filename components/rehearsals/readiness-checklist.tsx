"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateReadinessAction } from "@/app/actions/rehearsal-participant-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ReadinessChecklistProps {
  rehearsalId: string;
  farewellId: string;
  userId: string;
  initialReadiness: any; // { costume: boolean, props: boolean }
}

export function ReadinessChecklist({
  rehearsalId,
  farewellId,
  userId,
  initialReadiness,
}: ReadinessChecklistProps) {
  const router = useRouter();
  const [readiness, setReadiness] = useState(initialReadiness || {});

  async function toggle(key: string, checked: boolean) {
    const newState = { ...readiness, [key]: checked };
    setReadiness(newState);

    // Debounce or optimistic? Let's just fire.
    const result = await updateReadinessAction(
      rehearsalId,
      farewellId,
      userId,
      newState
    );
    if (result.error) {
      toast.error("Failed to update status");
      setReadiness(readiness); // Revert
    } else {
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Readiness Checklist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="costume"
            checked={readiness.costume || false}
            onCheckedChange={(c) => toggle("costume", c as boolean)}
          />
          <Label
            htmlFor="costume"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I have my complete costume
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="props"
            checked={readiness.props || false}
            onCheckedChange={(c) => toggle("props", c as boolean)}
          />
          <Label
            htmlFor="props"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I brought all necessary props
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
