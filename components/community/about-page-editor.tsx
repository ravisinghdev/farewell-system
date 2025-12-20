"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Save,
  X,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  upsertAboutSectionAction,
  deleteAboutSectionAction,
} from "@/app/actions/about-actions";
import { useRouter } from "next/navigation";

interface Section {
  id?: string;
  title: string;
  content: string;
  image_url?: string;
  order_index: number;
}

interface AboutPageEditorProps {
  farewellId: string;
  initialSections: Section[];
  onClose: () => void;
}

export function AboutPageEditor({
  farewellId,
  initialSections,
  onClose,
}: AboutPageEditorProps) {
  const [sections, setSections] = useState<Section[]>(
    initialSections.length > 0
      ? initialSections
      : [{ title: "", content: "", order_index: 0 }]
  );
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        title: "",
        content: "",
        order_index: sections.length,
      },
    ]);
  };

  const handleUpdateSection = (
    index: number,
    field: keyof Section,
    value: any
  ) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setSections(newSections);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === sections.length - 1)
    )
      return;

    const newSections = [...sections];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newSections[index], newSections[swapIndex]] = [
      newSections[swapIndex],
      newSections[index],
    ];
    // Update order_index
    newSections.forEach((s, i) => (s.order_index = i));
    setSections(newSections);
  };

  const handleDelete = async (index: number) => {
    const section = sections[index];
    if (section.id) {
      // If it has an ID, delete from DB immediately or mark for deletion?
      // For simplicity, let's delete immediately if user confirms
      if (!confirm("Delete this section permanently?")) return;

      setSaving(true);
      const res = await deleteAboutSectionAction(section.id, farewellId);
      setSaving(false);
      if (res.error) {
        toast.error(res.error);
        return;
      }
    }
    const newSections = sections.filter((_, i) => i !== index);
    newSections.forEach((s, i) => (s.order_index = i));
    setSections(newSections);
  };

  const handleSave = async () => {
    setSaving(true);
    let errorCount = 0;

    // simplistic: save all one by one. Ideally optimize bulk upsert.
    for (const [index, section] of sections.entries()) {
      const res = await upsertAboutSectionAction(farewellId, {
        ...section,
        order_index: index,
        image_url: section.image_url || undefined,
      });
      if (res.error) errorCount++;
    }

    setSaving(false);
    if (errorCount > 0) {
      toast.error(`Failed to save ${errorCount} sections.`);
    } else {
      toast.success("Page updated successfully");
      router.refresh(); // Ensure server fetch is fresh
      onClose();
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      <div className="flex items-center justify-between sticky top-4 z-20 bg-background/80 backdrop-blur-md p-4 rounded-xl border shadow-sm">
        <h2 className="text-xl font-semibold">Editing About Page</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={saving}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <Card key={index} className="relative group">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Section {index + 1}
              </CardTitle>
              <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleMove(index, "up")}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleMove(index, "down")}
                  disabled={index === sections.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={section.title}
                  placeholder="e.g. Our Journey"
                  onChange={(e) =>
                    handleUpdateSection(index, "title", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={section.content}
                  placeholder="Tell your story..."
                  className="min-h-[150px]"
                  onChange={(e) =>
                    handleUpdateSection(index, "content", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Image URL (Optional)
                </Label>
                <Input
                  value={section.image_url || ""}
                  placeholder="https://..."
                  onChange={(e) =>
                    handleUpdateSection(index, "image_url", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full border-dashed py-8"
        onClick={handleAddSection}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Section
      </Button>
    </div>
  );
}
