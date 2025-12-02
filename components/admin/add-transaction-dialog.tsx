"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  searchMembersAction,
  createManualContributionAction,
} from "@/app/actions/contribution-actions";

interface AddTransactionDialogProps {
  farewellId: string;
  onSuccess: () => void;
}

export function AddTransactionDialog({
  farewellId,
  onSuccess,
}: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSearch() {
    if (!searchQuery) return;
    setLoading(true);
    const result = await searchMembersAction(farewellId, searchQuery);
    if (result.success) {
      setSearchResults(result.data);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }
    if (!amount) {
      toast.error("Please enter amount");
      return;
    }

    setLoading(true);
    const result = await createManualContributionAction(
      farewellId,
      selectedUser.userId,
      parseFloat(amount),
      method,
      transactionId || null,
      notes || null
    );

    if (result.success) {
      toast.success("Transaction added successfully");
      setOpen(false);
      onSuccess();
      // Reset form
      setSelectedUser(null);
      setAmount("");
      setMethod("cash");
      setTransactionId("");
      setNotes("");
      setSearchQuery("");
      setSearchResults([]);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white text-black hover:bg-white/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Manual Transaction</DialogTitle>
          <DialogDescription>
            Record an offline payment (Cash, Bank Transfer, etc.).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label>User</Label>
            {!selectedUser ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSearch}
                    disabled={loading}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                    {searchResults.map((user) => (
                      <div
                        key={user.userId}
                        className="p-2 hover:bg-accent rounded cursor-pointer text-sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 border rounded-md bg-accent/50">
                <div>
                  <div className="font-medium text-sm">{selectedUser.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedUser.email}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                >
                  Change
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="txnId">Transaction ID (Optional)</Label>
            <Input
              id="txnId"
              placeholder="e.g. UPI Ref No."
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
