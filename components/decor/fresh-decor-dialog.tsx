"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Trash2,
  Link as LinkIcon,
  DollarSign,
  UploadCloud,
} from "lucide-react";
import {
  createDecorItemAction,
  updateDecorItemAction,
  deleteDecorItemAction,
} from "@/app/actions/event-actions";
import { toast } from "sonner";
import { Database } from "@/types/supabase";
import { createClient } from "@/utils/supabase/client";
import { Badge } from "@/components/ui/badge";

type DecorItem = Database["public"]["Tables"]["decor_items"]["Row"];

interface FreshDecorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farewellId: string;
  itemToEdit?: DecorItem | null;
  onSuccess?: () => void;
}

const CATEGORIES = [
  "Stage",
  "Entrance",
  "Seating",
  "Lighting",
  "Photo Booth",
  "Table Centerpieces",
  "Balloons",
  "Flowers",
  "Banner/Signage",
  "Audio/Visual",
  "Other",
];

export function FreshDecorDialog({
  open,
  onOpenChange,
  farewellId,
  itemToEdit,
  onSuccess,
}: FreshDecorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("Stage");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("planned");

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFile(null); // Reset file
      setIsUploading(false);
      if (itemToEdit) {
        setItemName(itemToEdit.item_name);
        setCategory(itemToEdit.category);
        setQuantity(itemToEdit.quantity.toString());
        setNotes(itemToEdit.notes || "");
        setEstimatedCost(itemToEdit.estimated_cost?.toString() || "");
        setActualCost(itemToEdit.actual_cost?.toString() || "");
        setImageUrl(itemToEdit.image_url || "");
        setStatus(itemToEdit.status || "planned");
      } else {
        // Reset for create
        setItemName("");
        setCategory("Stage");
        setQuantity("1");
        setNotes("");
        setEstimatedCost("");
        setActualCost("");
        setImageUrl("");
        setStatus("planned");
      }
    }
  }, [open, itemToEdit]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Create preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImageUrl(ev.target.result as string); // Provisional preview
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const uploadImage = async (fileToUpload: File): Promise<string | null> => {
    try {
      const supabase = createClient();
      const fileExt = fileToUpload.name.split(".").pop();
      const fileName = `decor/${farewellId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("memories") // Using existing bucket
        .upload(fileName, fileToUpload);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("memories").getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload image");
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!itemName.trim()) {
      toast.error("Item name is required");
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl = imageUrl;

      // Upload if there's a new file selected
      if (file) {
        const uploadedUrl = await uploadImage(file);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        } else {
          setLoading(false);
          return; // Stop if upload failed
        }
      }

      const payload = {
        item_name: itemName,
        category,
        quantity: parseInt(quantity) || 1,
        notes,
        estimated_cost: parseFloat(estimatedCost) || 0,
        actual_cost: parseFloat(actualCost) || 0,
        image_url: finalImageUrl,
        status,
      };

      if (itemToEdit) {
        // Update
        const result = await updateDecorItemAction(
          itemToEdit.id,
          farewellId,
          payload
        );
        if (result.error) throw new Error(result.error);
        toast.success("Decor item updated");
      } else {
        // Create
        const result = await createDecorItemAction(farewellId, payload);
        if (result.error) throw new Error(result.error);
        toast.success("Decor item added");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToEdit) return;
    if (!confirm("Are you sure you want to delete this item?")) return;

    setDeleting(true);
    try {
      const result = await deleteDecorItemAction(itemToEdit.id, farewellId);
      if (result.error) throw new Error(result.error);
      toast.success("Item deleted");
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const isEditing = !!itemToEdit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background/80 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? "Edit Decor Item" : "Add New Decor Item"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="i-name">Item Name</Label>
            <Input
              id="i-name"
              placeholder="e.g. Red Carpet"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="rounded-xl bg-secondary/50 border-white/5 focus-visible:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl bg-secondary/50 border-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/10 bg-popover/95 backdrop-blur-lg">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl bg-secondary/50 border-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/10 bg-popover/95 backdrop-blur-lg">
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="purchased">Purchased</SelectItem>
                  <SelectItem value="arranged">Arranged</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="rounded-xl bg-secondary/50 border-white/5"
              />
            </div>
            <div className="grid gap-2">
              <Label>Est. Cost</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  className="pl-9 rounded-xl bg-secondary/50 border-white/5"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Actual Cost</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  className="pl-9 rounded-xl bg-secondary/50 border-white/5"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="img-url">Image</Label>
            <div className="flex bg-secondary/50 rounded-xl border border-white/5 overflow-hidden">
              <Input
                id="img-url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setFile(null); // Clear file if manually typing URL
                }}
                className="flex-1 bg-transparent border-0 rounded-none focus-visible:ring-0 focus-visible:bg-white/5"
              />
              <div className="border-l border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                <label className="cursor-pointer h-full px-4 flex items-center justify-center">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <UploadCloud className="w-5 h-5 text-muted-foreground" />
                </label>
              </div>
            </div>

            {imageUrl && (
              <div className="mt-2 relative h-32 w-full rounded-xl overflow-hidden bg-black/20 border border-white/10 group">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover opacity-80"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                {file && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Badge
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-md"
                    >
                      New Upload
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Dimensions, rental details, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl bg-secondary/50 border-white/5 min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="flex items-center gap-2 sm:justify-between">
          {isEditing ? (
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={deleting || loading}
              className="text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
