"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { assignMoneyAction } from "@/app/actions/payout-actions";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AllocationManagerProps {
  farewellId: string;
  users: { id: string; name: string; email: string }[];
}

export function AllocationManager({
  farewellId,
  users,
}: AllocationManagerProps) {
  const [selectedUser, setSelectedUser] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedUser || !amount) return;
    setLoading(true);
    try {
      const result = await assignMoneyAction(
        farewellId,
        selectedUser,
        parseFloat(amount)
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Money assigned successfully");
        setAmount("");
        setSelectedUser("");
      }
    } catch (e) {
      toast.error("Failed to assign money");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Money</CardTitle>
        <CardDescription>Allocate budget to members.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <Label>Select User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-32 space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
        <Button
          onClick={handleAssign}
          disabled={loading || !selectedUser || !amount}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <UserPlus className="mr-2 h-4 w-4" />
          Assign
        </Button>
      </CardContent>
    </Card>
  );
}
