"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getDecorItemByIdAction,
  updateDecorItemAction,
} from "@/app/actions/event-actions";
import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Box,
  ShoppingCart,
  Check,
  DollarSign,
  Image as ImageIcon,
  Edit,
  Trash,
  Calendar,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { FreshDecorDialog } from "@/components/decor/fresh-decor-dialog";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DecorItemPage() {
  const params = useParams();
  const farewellId = params.id as string;
  const itemId = params.itemId as string;
  const router = useRouter();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchItem();
  }, [itemId]);

  const fetchItem = async () => {
    try {
      const data = await getDecorItemByIdAction(itemId);
      setItem(data);
    } catch (error) {
      console.error("Failed to fetch item", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-destructive">
          Item not found
        </h2>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const statusMap: any = {
    planned: {
      label: "Planned",
      icon: Box,
      color: "text-slate-500",
      bg: "bg-slate-500/10",
      border: "border-slate-500/20",
    },
    purchased: {
      label: "Purchased",
      icon: ShoppingCart,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    arranged: {
      label: "Arranged",
      icon: Check,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  };

  const StatusIcon = statusMap[item.status]?.icon ?? Box;
  const statusConfig = statusMap[item.status] || statusMap.planned;

  return (
    <PageScaffold
      title={item.item_name}
      description={`Category: ${item.category}`}
      action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Edit className="w-4 h-4 mr-2" /> Edit Details
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Image & Status */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="aspect-square bg-muted flex items-center justify-center relative">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.item_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
              )}
              <div className="absolute top-4 right-4">
                <Badge
                  variant="outline"
                  className={`${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} backdrop-blur-md`}
                >
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              {item.assignee ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.assignee.avatar_url} />
                    <AvatarFallback>
                      {item.assignee.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {item.assignee.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Assigned Member
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No one assigned yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Quantity
                  </span>
                  <p className="font-semibold text-lg">{item.quantity}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Category
                  </span>
                  <p className="font-medium">{item.category}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Estimated Cost
                  </span>
                  <p className="font-semibold text-lg flex items-center">
                    <DollarSign className="w-4 h-4 mr-1 text-muted-foreground" />
                    {item.estimated_cost?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Actual Cost
                  </span>
                  <p
                    className={`font-semibold text-lg flex items-center ${
                      item.actual_cost > (item.estimated_cost || 0)
                        ? "text-red-500"
                        : "text-emerald-500"
                    }`}
                  >
                    <DollarSign className="w-4 h-4 mr-1" />
                    {item.actual_cost?.toLocaleString() || "0"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Notes
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.notes || "No notes added."}
                </p>
              </div>

              <div className="space-y-1 pt-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Created
                </span>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-3 h-3 mr-2" />
                  {format(new Date(item.created_at), "PPP")}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <FreshDecorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        farewellId={farewellId}
        itemToEdit={item}
        onSuccess={() => {
          fetchItem();
        }}
      />
    </PageScaffold>
  );
}
