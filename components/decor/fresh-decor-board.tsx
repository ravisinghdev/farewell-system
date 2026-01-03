"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Palette,
  Plus,
  Search,
  ShoppingCart,
  Box,
  Check,
  DollarSign,
  Image as ImageIcon,
  MoreVertical,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FreshDecorDialog } from "./fresh-decor-dialog";
import { getDecorItemsAction } from "@/app/actions/event-actions";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FreshDecorBoardProps {
  farewellId: string;
}

export function FreshDecorBoard({ farewellId }: FreshDecorBoardProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Stats
  const stats = useMemo(() => {
    const totalItems = items.length;
    const estimatedTotal = items.reduce(
      (sum, item) => sum + (item.estimated_cost || 0),
      0
    );
    const actualTotal = items.reduce(
      (sum, item) => sum + (item.actual_cost || 0),
      0
    );
    const purchasedCount = items.filter((i) =>
      ["purchased", "arranged"].includes(i.status)
    ).length;

    return { totalItems, estimatedTotal, actualTotal, purchasedCount };
  }, [items]);

  // Fetch Data
  const fetchData = async () => {
    try {
      const data = await getDecorItemsAction(farewellId);
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch decor items", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [farewellId]);

  // Realtime
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("fresh-decor-board")
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

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto space-y-6">
      {/* Header & Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search & Actions */}
        <div className="md:col-span-2 flex flex-col justify-between h-full gap-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              Decor & Ambience
            </h1>
            <Button
              onClick={handleCreate}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl h-10 px-6 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          </div>

          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search decor items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-white/10 focus:bg-background/80 shadow-sm rounded-xl h-11 transition-all"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <Palette className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Progress
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {stats.purchasedCount}
              <span className="text-sm text-muted-foreground">
                /{stats.totalItems}
              </span>
            </span>
            <span className="text-xs text-blue-400 font-medium ml-auto">
              Items Ready
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-blue-950/30 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  stats.totalItems > 0
                    ? (stats.purchasedCount / stats.totalItems) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Budget
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Est:</span>
              <span className="text-lg font-bold">
                ${stats.estimatedTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Act:</span>
              <span className="text-lg font-bold text-emerald-400">
                ${stats.actualTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <ScrollArea className="flex-1 -mx-4 md:mx-0 px-4 md:px-0 h-[calc(100vh-280px)]">
        {filteredItems.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Palette className="w-12 h-12 mb-4 opacity-20" />
            <p>No items found. Add some decor!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
            <AnimatePresence>
              {filteredItems.map((item) => (
                <DecorItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => handleEdit(item)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      <FreshDecorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        farewellId={farewellId}
        itemToEdit={selectedItem}
        onSuccess={() => {
          fetchData();
          router.refresh();
        }}
      />
    </div>
  );
}

function DecorItemCard({ item, onEdit }: { item: any; onEdit: () => void }) {
  const statusConfig: any = {
    planned: {
      color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      icon: Box,
      label: "Planned",
    },
    purchased: {
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      icon: ShoppingCart,
      label: "Purchased",
    },
    arranged: {
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: Check,
      label: "Arranged",
    },
    returned: {
      color: "bg-red-500/10 text-red-400 border-red-500/20",
      icon: Box,
      label: "Returned",
    },
  };

  const config = statusConfig[item.status] || statusConfig.planned;
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1"
      onClick={onEdit}
    >
      <div className="aspect-video w-full bg-black/40 relative">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.item_name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/5">
            <ImageIcon className="w-12 h-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
          <h3 className="text-lg font-bold text-white leading-tight">
            {item.item_name}
          </h3>
          <p className="text-xs text-white/60 font-medium">{item.category}</p>
        </div>

        <div className="absolute top-3 right-3">
          <Badge
            variant="outline"
            className={cn(
              "backdrop-blur-md border-0 bg-black/50 text-white text-[10px] px-2 h-5",
              config.color
            )}
          >
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </div>

      <div className="p-4 grid gap-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            Qty:{" "}
            <span className="text-foreground font-medium">{item.quantity}</span>
          </span>
          <span className="text-muted-foreground flex items-center">
            Est:{" "}
            <span className="text-foreground font-medium ml-1">
              ${item.estimated_cost}
            </span>
          </span>
        </div>
        {item.notes && (
          <p className="text-xs text-muted-foreground line-clamp-1 bg-white/5 p-1.5 rounded-md px-2">
            {item.notes}
          </p>
        )}
      </div>
    </motion.div>
  );
}
