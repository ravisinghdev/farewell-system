import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Pending Approval",
  description:
    "Your join request is awaiting admin approval. Please check back later.",
};

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md shadow-lg text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-yellow-100 rounded-full dark:bg-yellow-900/20">
              <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
            </div>
          </div>
          <CardTitle className="text-2xl">Approval Pending</CardTitle>
          <CardDescription>
            Your request to join the farewell is awaiting admin approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please check back later or contact your class representative.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
