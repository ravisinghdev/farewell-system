"use client";

import { useState } from "react";
import { CreateDutyDialog } from "@/components/duties/create-duty-dialog";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface PromoteToDutyMenuItemProps {
  segmentTitle: string;
  segmentNotes?: string;
  onPromote?: () => void;
}

export function PromoteToDutyMenuItem({
  segmentTitle,
  segmentNotes,
  onPromote,
}: PromoteToDutyMenuItemProps) {
  const [open, setOpen] = useState(false);

  // We want to combine segment info into a useful description
  const description = `Promoted from Run of Show segment: "${segmentTitle}"\n\nNotes from Rehearsal:\n${
    segmentNotes || "No notes provided."
  }`;

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault(); // Prevent closing the menu immediately if we were just triggering a customized dialog, but here we open a separate dialog
          setOpen(true);
        }}
      >
        <ClipboardList className="w-4 h-4 mr-2" />
        Promote to Duty
      </DropdownMenuItem>

      <CreateDutyDialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          // If closed, we might want to notify parent, but not strictly necessary
        }}
        initialTitle={`Execute: ${segmentTitle}`}
        initialDescription={description}
        onSuccess={() => {
          if (onPromote) onPromote();
          setOpen(false);
        }}
      />
    </>
  );
}
