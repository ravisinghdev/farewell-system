"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ShoppingCart,
  Box,
  Check,
  DollarSign,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FreshDecorDialog } from "./fresh-decor-dialog";
import { getDecorItemsAction } from "@/app/actions/event-actions";
import { cn } from "@/lib/utils";

interface FreshDecorBoardProps {
  farewellId: string;
}

export function FreshDecorBoard({ farewellId }: FreshDecorBoardProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const router = useRouter();

  const stats = useMemo(() => {
    const total = items.length;
    const ready = items.filter((i) =>
      ["purchased", "arranged"].includes(i.status)
    ).length;

    return { total, ready };
  }, [items]);

  const fetchData = async () => {
    try {
      const data = await getDecorItemsAction(farewellId);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [farewellId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("decor-board")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "decor_items",
          filter: `farewell_id=eq.${farewellId}`,
        },
        () => {
          fetchData();
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, router]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    return items.filter(
      (i) =>
        i.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Decor & Ambience
          </h2>
          <p className="text-sm text-muted-foreground">
            {stats.ready}/{stats.total} items ready
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 w-44 sm:w-56"
            />
          </div>

          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Items */}
      {filteredItems.length === 0 && !loading ? (
        <div className="py-24 text-center text-sm text-muted-foreground">
          No decor items yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((item) => (
            <DecorItemRow
              key={item.id}
              item={item}
              onClick={() =>
                router.push(`/dashboard/${farewellId}/decor/${item.id}`)
              }
            />
          ))}
        </div>
      )}

      <FreshDecorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        farewellId={farewellId}
        itemToEdit={selectedItem}
        onSuccess={fetchData}
      />
    </div>
  );
}

function DecorItemRow({ item, onClick }: { item: any; onClick: () => void }) {
  const statusMap: any = {
    planned: { label: "Planned", icon: Box },
    purchased: { label: "Purchased", icon: ShoppingCart },
    arranged: { label: "Arranged", icon: Check },
  };

  const StatusIcon = statusMap[item.status]?.icon ?? Box;

  return (
    <div
      onClick={onClick}
      className="group flex gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/40 transition-colors cursor-pointer"
    >
      {/* Image */}
      <div className="h-14 w-20 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.item_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-2">
          <div>
            <p className="font-medium leading-tight line-clamp-1">
              {item.item_name}
            </p>
            <p className="text-xs text-muted-foreground">{item.category}</p>
          </div>

          <Badge variant="outline" className="h-5 text-xs">
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusMap[item.status]?.label}
          </Badge>
        </div>

        <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
          <span>Qty: {item.quantity}</span>
          <span>${item.estimated_cost}</span>
        </div>
      </div>
    </div>
  );
}
