"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitFeedbackAction } from "@/app/actions/feedback-actions";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FeedbackFormProps {
  farewellId: string;
}

export function FeedbackForm({ farewellId }: FeedbackFormProps) {
  const [content, setContent] = useState("");
  const [type, setType] = useState<"feedback" | "suggestion" | "bug" | "other">(
    "feedback"
  );
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!content.trim()) return;

    startTransition(async () => {
      const res = await submitFeedbackAction(
        farewellId,
        content,
        type,
        isAnonymous
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Feedback submitted successfully!");
        setContent("");
        setType("feedback");
        setIsAnonymous(false);
      }
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-none shadow-lg bg-gradient-to-br from-card to-muted/30">
      <CardHeader>
        <CardTitle>Submit Feedback</CardTitle>
        <CardDescription>
          Help us improve the farewell experience. Your suggestions and feedback
          are valuable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(v: any) => setType(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feedback">General Feedback</SelectItem>
              <SelectItem value="suggestion">Suggestion</SelectItem>
              <SelectItem value="bug">Bug Report</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Details</Label>
          <Textarea
            id="content"
            placeholder="Tell us more..."
            className="h-32 resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg bg-background/50">
          <Label
            htmlFor="anonymous"
            className="flex flex-col space-y-1 cursor-pointer"
          >
            <span>Submit Anonymously</span>
            <span className="font-normal text-xs text-muted-foreground">
              Your name will be hidden from admins
            </span>
          </Label>
          <Switch
            id="anonymous"
            checked={isAnonymous}
            onCheckedChange={setIsAnonymous}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isPending || !content.trim()}
          className="w-full sm:w-auto"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Submit Feedback
        </Button>
      </CardFooter>
    </Card>
  );
}
