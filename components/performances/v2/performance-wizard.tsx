"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { CheckCircle2, ChevronRight, Mic2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface PerformanceWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
}

const STEPS = [
  { id: "basic", title: "Basic Info" },
  { id: "tech", title: "Tech Requirements" },
  { id: "review", title: "Review" },
];

export function PerformanceWizard({
  open,
  onOpenChange,
  onSubmit,
}: PerformanceWizardProps) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    duration_seconds: 300,
    risk_level: "low",
    description: "",
    tech_mics: 0,
    tech_props: "",
    tech_lighting: "standard",
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Transform data to match API expectations if needed
      const payload = {
        ...formData,
        stage_requirements: {
          mics: formData.tech_mics,
          lighting: formData.tech_lighting,
          props: formData.tech_props ? formData.tech_props.split(",") : [],
        },
      };
      await onSubmit(payload);
      onOpenChange(false);
      setStep(0);
      setFormData({
        title: "",
        type: "",
        duration_seconds: 300,
        risk_level: "low",
        description: "",
        tech_mics: 0,
        tech_props: "",
        tech_lighting: "standard",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <div className="bg-muted/30 p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-xl">New Performance</DialogTitle>
            <div className="text-sm text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </div>
          </div>

          {/* Stepper */}
          <div className="flex gap-2">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= step ? "bg-primary" : "bg-primary/20"
                )}
              />
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <Label>Performance Title</Label>
                <Input
                  placeholder="e.g. The Farewell Group Dance"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => updateField("type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dance">Dance</SelectItem>
                      <SelectItem value="group">Group Act</SelectItem>
                      <SelectItem value="solo">Solo Singing</SelectItem>
                      <SelectItem value="band">Live Band</SelectItem>
                      <SelectItem value="skit">Skit / Drama</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estimated Duration (sec)</Label>
                  <Input
                    type="number"
                    value={formData.duration_seconds}
                    onChange={(e) =>
                      updateField("duration_seconds", parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Short Description</Label>
                <Textarea
                  placeholder="Brief summary of the act..."
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4 border rounded-lg p-4 bg-card">
                  <div className="flex items-center gap-2 font-medium">
                    <Mic2 className="w-4 h-4 text-primary" /> Audio
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Microphones</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.tech_mics}
                      onChange={(e) =>
                        updateField("tech_mics", parseInt(e.target.value))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4 border rounded-lg p-4 bg-card">
                  <div className="flex items-center gap-2 font-medium">
                    <Users className="w-4 h-4 text-primary" /> Staging
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Props (comma separated)</Label>
                    <Input
                      placeholder="Chair, Mic Stand..."
                      value={formData.tech_props}
                      onChange={(e) =>
                        updateField("tech_props", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lighting Preference</Label>
                <Select
                  value={formData.tech_lighting}
                  onValueChange={(v) => updateField("tech_lighting", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Warm</SelectItem>
                    <SelectItem value="dynamic">Dynamic / Party</SelectItem>
                    <SelectItem value="spotlight">Spotlight Only</SelectItem>
                    <SelectItem value="dim">Dim / Moody</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-center animate-in fade-in slide-in-from-right-4">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold">Ready to Create?</h3>
              <div className="text-sm text-muted-foreground max-w-xs mx-auto">
                Review your details before finalizing. You can edit tech
                requirements later.
              </div>

              <div className="bg-muted p-4 rounded-lg text-left text-sm space-y-2 mt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title:</span>
                  <span className="font-medium">{formData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">
                    {formData.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mics:</span>
                  <span className="font-medium">{formData.tech_mics}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="bg-muted/30 p-4 border-t gap-2">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={submitting}
            >
              Back
            </Button>
          )}

          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!formData.title}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Creating..." : "Create Performance"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
