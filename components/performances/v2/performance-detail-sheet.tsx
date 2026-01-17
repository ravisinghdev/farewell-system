"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Performance } from "@/types/performance";
import { Mic2, Lightbulb, Users, Music, Video, StickyNote } from "lucide-react";

interface PerformanceDetailSheetProps {
  performance: Performance | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Performance>) => Promise<void>;
}

export function PerformanceDetailSheet({
  performance,
  isOpen,
  onClose,
  onSave,
}: PerformanceDetailSheetProps) {
  const [activeTab, setActiveTab] = useState("tech");
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (performance) {
      setFormData({
        title: performance.title,
        type: performance.type,
        risk_level: performance.risk_level,
        status: performance.status,
        duration_seconds: performance.duration_seconds,
        notes: "", // Add notes to DB schema later if needed, or use existing field
        stage_requirements: {
          mics: performance.stage_requirements?.mics || 0,
          lighting: performance.stage_requirements?.lighting || "standard",
          props: performance.stage_requirements?.props?.join(", ") || "",
        },
        video_url: performance.id, // Assuming video_url field exists or mapped
        // Asset placeholders
        music_track: null,
      });
    }
  }, [performance]);

  const handleSave = async () => {
    if (!performance) return;
    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        risk_level: formData.risk_level,
        duration_seconds: parseInt(formData.duration_seconds),
        stage_requirements: {
          mics: parseInt(formData.stage_requirements.mics),
          lighting: formData.stage_requirements.lighting,
          props: formData.stage_requirements.props
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean),
        },
      };
      await onSave(performance.id, payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!performance) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Backstage Details</SheetTitle>
          <SheetDescription>
            Manage technical requirements and assets for{" "}
            <span className="font-semibold text-foreground">
              {performance.title}
            </span>
            .
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start grid grid-cols-3 mb-4">
            <TabsTrigger value="tech">Tech & Stage</TabsTrigger>
            <TabsTrigger value="assets">Media & Assets</TabsTrigger>
            <TabsTrigger value="info">General Info</TabsTrigger>
          </TabsList>

          <TabsContent value="tech" className="space-y-6">
            <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
              <h4 className="font-medium flex items-center gap-2">
                <Mic2 className="w-4 h-4" /> Audio Requirements
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Microphones</Label>
                  <Input
                    type="number"
                    value={formData.stage_requirements?.mics}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stage_requirements: {
                          ...formData.stage_requirements,
                          mics: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Backup Audio?</Label>
                  <Select defaultValue="no">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes (Phone/Track)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
              <h4 className="font-medium flex items-center gap-2">
                <Lightbulb className="w-4 h-4" /> Lighting & Visuals
              </h4>
              <div className="space-y-2">
                <Label>Mood / Preset</Label>
                <Select
                  value={formData.stage_requirements?.lighting}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      stage_requirements: {
                        ...formData.stage_requirements,
                        lighting: v,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Warm</SelectItem>
                    <SelectItem value="dynamic">Dynamic / RGB Party</SelectItem>
                    <SelectItem value="spotlight">Spotlight Only</SelectItem>
                    <SelectItem value="dim">Dim / Emotional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
              <h4 className="font-medium flex items-center gap-2">
                <Users className="w-4 h-4" /> Props & Staging
              </h4>
              <div className="space-y-2">
                <Label>Required Props</Label>
                <Textarea
                  placeholder="e.g. 2 Chairs, 1 Table, Podium..."
                  value={formData.stage_requirements?.props}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stage_requirements: {
                        ...formData.stage_requirements,
                        props: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            <div className="border border-dashed rounded-lg p-8 text-center space-y-3 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Music className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h4 className="font-medium">Music Track</h4>
                <p className="text-xs text-muted-foreground">
                  Upload .mp3 or .wav (Max 10MB)
                </p>
              </div>
            </div>

            <div className="border border-dashed rounded-lg p-8 text-center space-y-3 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="mx-auto w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                <Video className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h4 className="font-medium">Backdrop / Video</h4>
                <p className="text-xs text-muted-foreground">
                  Upload .mp4 or .jpg for screen
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="info" className="space-y-5">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (seconds)</Label>
                <Input
                  type="number"
                  value={formData.duration_seconds}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_seconds: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Risk Level</Label>
                <Select
                  value={formData.risk_level}
                  onValueChange={(v) =>
                    setFormData({ ...formData, risk_level: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-8">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
