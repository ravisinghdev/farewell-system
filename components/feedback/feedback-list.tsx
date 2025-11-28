"use client";

import { Feedback } from "@/app/actions/feedback-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import { format } from "date-fns";
import {
  AlertCircle,
  Lightbulb,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

interface FeedbackListProps {
  feedback: Feedback[];
}

export function FeedbackList({ feedback }: FeedbackListProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "suggestion":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case "feedback":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "reviewed":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "implemented":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "rejected":
        return "bg-red-500/10 text-red-600 border-red-200";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="space-y-4">
      {feedback.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardHeader className="flex flex-row items-start gap-4 pb-2 space-y-0">
            <div className="mt-1">{getTypeIcon(item.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold capitalize text-sm">
                    {item.type}
                  </span>
                  <Badge
                    variant="outline"
                    className={getStatusColor(item.status)}
                  >
                    {item.status}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(item.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {item.is_anonymous ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[8px]">AN</AvatarFallback>
                    </Avatar>
                    <span>Anonymous</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={item.user?.avatar_url || ""} />
                      <AvatarFallback className="text-[8px]">
                        {getInitials(item.user?.full_name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <span>{item.user?.full_name}</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-foreground/90">
              {item.content}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
