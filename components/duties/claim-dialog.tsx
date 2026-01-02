"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitDutyClaimAction } from "@/app/actions/duty-claim-actions";
import { Loader2, UploadCloud, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const claimSchema = z.object({
  claimed_amount: z.coerce.number().min(0, "Non-negative"),
  description: z.string().optional(),
  proof_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

interface ClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dutyId: string;
}

export function ClaimDialog({ open, onOpenChange, dutyId }: ClaimDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      claimed_amount: 0,
      description: "",
      proof_url: "",
    },
  });

  async function onSubmit(data: any) {
    setIsSubmitting(true);
    try {
      await submitDutyClaimAction({
        duty_id: dutyId,
        claimed_amount: data.claimed_amount,
        description: data.description || "",
        proof_url: data.proof_url || "",
      });
      toast.success("Claim submitted successfully");
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to submit claim");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete & Claim</DialogTitle>
          <DialogDescription>
            Submit proof of work and claim expenses if any.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="claimed_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claim Amount (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      name={field.name}
                      ref={field.ref}
                      value={field.value as number}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || 0)
                      }
                      onBlur={field.onBlur}
                      disabled={field.disabled}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter 0 if no reimbursement needed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes / Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What was done?"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proof_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proof Attachment</FormLabel>
                  <div className="flex flex-col gap-3">
                    {/* URL Input (Hidden or Readonly if uploaded) */}
                    {!field.value ? (
                      <div
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() =>
                          document.getElementById("receipt-upload")?.click()
                        }
                      >
                        <input
                          id="receipt-upload"
                          type="file"
                          className="hidden"
                          accept="image/*,application/pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            try {
                              toast.loading("Uploading proof...");
                              const supabase = createClient();
                              const fileExt = file.name.split(".").pop();
                              const fileName = `${dutyId}/${Date.now()}.${fileExt}`;

                              const { error: uploadError, data } =
                                await supabase.storage
                                  .from("receipts")
                                  .upload(fileName, file);

                              if (uploadError) throw uploadError;

                              const {
                                data: { publicUrl },
                              } = supabase.storage
                                .from("receipts")
                                .getPublicUrl(fileName);

                              field.onChange(publicUrl);
                              toast.dismiss();
                              toast.success("File uploaded!");
                            } catch (err: any) {
                              toast.dismiss();
                              toast.error("Upload failed: " + err.message);
                            }
                          }}
                        />
                        <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">
                          Click to upload receipt
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Images or PDFs supported
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/20">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm truncate flex-1 min-w-0">
                          {field.value}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => field.onChange("")}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or paste URL
                        </span>
                      </div>
                    </div>

                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Upload a receipt image/PDF or paste a link to your proof.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Claim
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
