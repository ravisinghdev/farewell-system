"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Palette, Check, ShoppingCart, Box } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getDecorItemsAction,
  createDecorItemAction,
  updateDecorStatusAction,
  deleteDecorItemAction,
} from "@/app/actions/event-actions";
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function DecorPage() {
  const params = useParams();
  const farewellId = params.id as string;
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell.role);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("Stage");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchItems();
  }, [farewellId]);

  async function fetchItems() {
    setLoading(true);
    const data = await getDecorItemsAction(farewellId);
    setItems(data);
    setLoading(false);
  }

  async function handleCreate() {
    if (!itemName || !category) {
      toast.error("Error", {
        description: "Please fill in all required fields",
      });
      return;
    }

    const result = await createDecorItemAction(farewellId, {
      item_name: itemName,
      category,
      quantity: parseInt(quantity) || 1,
      notes,
    });

    if (result.error) {
      toast.error("Error", {
        description: result.error,
      });
    } else {
      toast.success("Success", {
        description: "Decor item added",
      });
      setIsDialogOpen(false);
      resetForm();
      fetchItems();
    }
  }

  async function handleStatusUpdate(id: string, status: string) {
    const result = await updateDecorStatusAction(id, farewellId, status);
    if (result.error) {
      toast.error("Error", {
        description: result.error,
      });
    } else {
      fetchItems();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    const result = await deleteDecorItemAction(id, farewellId);
    if (result.error) {
      toast.error("Error", {
        description: result.error,
      });
    } else {
      fetchItems();
    }
  }

  function resetForm() {
    setItemName("");
    setCategory("Stage");
    setQuantity("1");
    setNotes("");
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "arranged":
        return <Check className="w-4 h-4" />;
      case "purchased":
        return <ShoppingCart className="w-4 h-4" />;
      default:
        return <Box className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "arranged":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "purchased":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    }
  };

  // Group items by category
  const groupedItems = items.reduce((acc: any, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <PageScaffold
      title="Decoration & Setup"
      description="Manage decor items and logistics for the event."
      action={
        isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Decor Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    placeholder="e.g. Red Carpet"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Stage">Stage</SelectItem>
                        <SelectItem value="Entrance">Entrance</SelectItem>
                        <SelectItem value="Seating">Seating</SelectItem>
                        <SelectItem value="Lighting">Lighting</SelectItem>
                        <SelectItem value="Photo Booth">Photo Booth</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input
                    placeholder="e.g. Need to rent"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }
    >
      {loading ? (
        <div className="text-center py-10">Loading decor items...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 border rounded-xl bg-muted/10">
          <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Decor Items</h3>
          <p className="text-muted-foreground mt-1">
            Start planning the event decoration by adding items.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(
            ([cat, catItems]: [string, any]) => (
              <div key={cat}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-primary rounded-full" />
                  {cat}
                </h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {catItems.map((item: any) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{item.item_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(
                              item.status
                            )} flex items-center gap-1 capitalize`}
                          >
                            {getStatusIcon(item.status)}
                            {item.status}
                          </Badge>
                        </div>

                        {item.notes && (
                          <p className="text-xs text-muted-foreground mb-3 bg-muted/30 p-1.5 rounded">
                            {item.notes}
                          </p>
                        )}

                        {isAdmin && (
                          <div className="flex justify-between items-center pt-2 border-t mt-2">
                            <div className="flex gap-1">
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className={
                                  item.status === "planned"
                                    ? "bg-primary/10"
                                    : ""
                                }
                                onClick={() =>
                                  handleStatusUpdate(item.id, "planned")
                                }
                                title="Planned"
                              >
                                <Box className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className={
                                  item.status === "purchased"
                                    ? "bg-primary/10"
                                    : ""
                                }
                                onClick={() =>
                                  handleStatusUpdate(item.id, "purchased")
                                }
                                title="Purchased"
                              >
                                <ShoppingCart className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className={
                                  item.status === "arranged"
                                    ? "bg-primary/10"
                                    : ""
                                }
                                onClick={() =>
                                  handleStatusUpdate(item.id, "arranged")
                                }
                                title="Arranged"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            </div>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </PageScaffold>
  );
}
