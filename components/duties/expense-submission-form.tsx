"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash, Upload, Loader2, X, Edit2 } from "lucide-react";
import { uploadDutyReceiptAction } from "@/app/actions/duty-actions";
import { useFarewell } from "@/components/providers/farewell-provider";
import { toast } from "sonner";
import { ImageEditor } from "@/components/ui/image-editor";

interface ExpenseSubmissionFormProps {
  dutyId: string;
  onSuccess: () => void;
}

export function ExpenseSubmissionForm({
  dutyId,
  onSuccess,
}: ExpenseSubmissionFormProps) {
  const { farewell } = useFarewell();
  const [items, setItems] = useState<{ description: string; amount: string }[]>(
    [{ description: "", amount: "" }]
  );
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(
    null
  );
  const [imageToEdit, setImageToEdit] = useState<string>("");

  const addItem = () => setItems([...items, { description: "", amount: "" }]);
  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));

  const updateItem = (
    index: number,
    field: "description" | "amount",
    value: string
  ) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);

      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...newFiles]);

      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    URL.revokeObjectURL(previews[index]);
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const openEditor = (index: number) => {
    setEditingImageIndex(index);
    setImageToEdit(previews[index]);
    setEditorOpen(true);
  };

  const handleEditorSave = (editedFile: File) => {
    if (editingImageIndex === null) return;

    const newFiles = [...files];
    newFiles[editingImageIndex] = editedFile;
    setFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[editingImageIndex]);
    newPreviews[editingImageIndex] = URL.createObjectURL(editedFile);
    setPreviews(newPreviews);
  };

  const handleSubmit = async () => {
    if (totalAmount <= 0) {
      toast.error("Total amount must be greater than 0");
      return;
    }
    if (files.length === 0) {
      toast.error("Please upload at least one receipt image");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("dutyId", dutyId);
      formData.append("amount", totalAmount.toString());
      formData.append("notes", notes);
      formData.append("items", JSON.stringify(items));

      files.forEach((f) => {
        formData.append("files", f);
      });

      // Import from duty-actions needed
      const result = await uploadDutyReceiptAction(farewell.id, formData); // Wait, first arg farewellId?
      // In duty-actions.ts Step 62: `export async function uploadDutyReceiptAction(farewellId: string, formData: FormData)`
      // We need farewellId. `ExpenseSubmissionForm` props only has `dutyId`.
      // We need to fetch farewellId or pass it.
      // Assuming we can't easily change props everywhere, we might need to fetch it?
      // Or looking at imports: `import { useFarewell } ...`? It's not imported.
      // I should add `useFarewell` hook usage.

      // Let's rely on update step to fix imports too.
      // I'll add useFarewell to top of component in next step?
      // Or assuming I can fix imports in this file.
      // Wait, `ExpenseSubmissionForm` is client component. I can use `useFarewell`.

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Expense submitted successfully");
        onSuccess();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit expense");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-card">
      <div className="space-y-2">
        <Label>Itemized List</Label>
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Item description"
              value={item.description}
              onChange={(e) => updateItem(index, "description", e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Amount"
              value={item.amount}
              onChange={(e) => updateItem(index, "amount", e.target.value)}
              className="w-24"
            />
            {items.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
              >
                <Trash className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={addItem}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Item
        </Button>
      </div>

      <div className="flex justify-between items-center font-semibold">
        <span>Total Claim:</span>
        <span>₹{totalAmount}</span>
      </div>

      <div className="space-y-2">
        <Label>Receipt Evidence</Label>

        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-upload")?.click()}
        >
          <input
            id="file-upload"
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-8 w-8" />
            <p className="text-sm font-medium">
              Click to upload or drag and drop
            </p>
            <p className="text-xs">Images or PDF (max 5MB)</p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative group border rounded-md overflow-hidden aspect-square"
              >
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditor(index);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editorOpen && (
        <ImageEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          imageSrc={imageToEdit}
          onSave={handleEditorSave}
        />
      )}

      <div className="space-y-2">
        <Label>Notes (Optional)</Label>
        <Textarea
          placeholder="Any additional context..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Submit Expense Claim"
        )}
      </Button>
    </div>
  );
}
