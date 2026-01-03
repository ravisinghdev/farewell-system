"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TimelineBlock } from "@/types/timeline";
import {
  createTimelineBlockAction,
  updateTimelineBlockDetailsAction,
} from "@/app/actions/event-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum([
    "performance",
    "announcement",
    "break",
    "buffer",
    "speech",
    "other",
  ]),
  duration_minutes: z.coerce
    .number()
    .min(1, "Duration must be at least 1 minute"),
  color_code: z.string().optional(),
  manual_start_time: z.string().optional(),
});

interface TimelineBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farewellId: string;
  blockToEdit?: TimelineBlock | null;
  currentOrderIndex?: number;
}

export function TimelineBlockDialog({
  open,
  onOpenChange,
  farewellId,
  blockToEdit,
  currentOrderIndex = 0,
}: TimelineBlockDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: "",
      type: "performance",
      duration_minutes: 5,
      color_code: "#3b82f6",
    },
  });

  useEffect(() => {
    if (blockToEdit) {
      form.reset({
        title: blockToEdit.title || "",
        type: (blockToEdit.type as any) || "performance",
        duration_minutes: Math.ceil(blockToEdit.duration_seconds / 60),
        color_code: blockToEdit.color_code || "#3b82f6",
        manual_start_time: blockToEdit.manual_start_time
          ? new Date(blockToEdit.manual_start_time).toISOString().slice(0, 16)
          : "",
      });
    } else {
      form.reset({
        title: "",
        type: "performance",
        duration_minutes: 5,
        color_code: "#3b82f6",
        manual_start_time: "",
      });
    }
  }, [blockToEdit, open, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      if (blockToEdit) {
        // Edit mode
        const res = await updateTimelineBlockDetailsAction(
          farewellId,
          blockToEdit.id,
          {
            title: values.title,
            type: values.type,
            duration_seconds: values.duration_minutes * 60,
            color_code: values.color_code,
            manual_start_time: values.manual_start_time
              ? new Date(values.manual_start_time).toISOString()
              : undefined,
          }
        );
        if (res.error) {
          toast.error("Failed to update block", { description: res.error });
        } else {
          toast.success("Block updated");
          onOpenChange(false);
          router.refresh();
        }
      } else {
        // Create mode
        const res = await createTimelineBlockAction(farewellId, {
          title: values.title,
          type: values.type,
          duration_seconds: values.duration_minutes * 60,
          order_index: currentOrderIndex,
          color_code: values.color_code,
          manual_start_time: values.manual_start_time
            ? new Date(values.manual_start_time).toISOString()
            : undefined,
        });
        if (res.error) {
          toast.error("Failed to create block", { description: res.error });
        } else {
          toast.success("Block created");
          onOpenChange(false);
          router.refresh();
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{blockToEdit ? "Edit Event" : "Add Event"}</DialogTitle>
          <DialogDescription>
            {blockToEdit
              ? "Make changes to your timeline block here."
              : "Add a new block to your timeline."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Welcome Speech" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="speech">Speech</SelectItem>
                        <SelectItem value="announcement">
                          Announcement
                        </SelectItem>
                        <SelectItem value="break">Break</SelectItem>
                        <SelectItem value="buffer">Buffer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (min)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="manual_start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Fixed Start Time{" "}
                    <span className="text-xs text-muted-foreground">
                      (Optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <DialogDescription className="text-xs">
                    Set a fixed time to override automatic sequencing.
                  </DialogDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color Tag</FormLabel>
                  <div className="space-y-3">
                    {/* Presets */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        "#3b82f6", // Blue
                        "#ef4444", // Red
                        "#22c55e", // Green
                        "#eab308", // Yellow
                        "#a855f7", // Purple
                        "#ec4899", // Pink
                        "#f97316", // Orange
                        "#64748b", // Slate
                      ].map((color) => (
                        <div
                          key={color}
                          className={`w-6 h-6 rounded-full cursor-pointer transition-all border-2 ${
                            field.value === color
                              ? "border-primary scale-110"
                              : "border-transparent hover:scale-110"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => field.onChange(color)}
                          title={color}
                        />
                      ))}
                    </div>

                    {/* Custom Picker */}
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-md border shadow-sm"
                        style={{ backgroundColor: field.value }}
                      />
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground w-12 text-center">
                          Custom
                        </span>
                        <FormControl>
                          <Input
                            type="color"
                            className="w-12 h-8 p-0 border-0"
                            {...field}
                          />
                        </FormControl>
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Saving..."
                  : blockToEdit
                  ? "Save Changes"
                  : "Create Block"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
