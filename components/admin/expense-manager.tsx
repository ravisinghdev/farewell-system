"use client";

import { useState } from "react";
import {
  createExpenseAction,
  deleteExpenseAction,
  type Expense,
} from "@/app/actions/expense-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/glass-card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Receipt, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ExpenseManagerProps {
  farewellId: string;
  initialExpenses: Expense[];
}

const CATEGORIES = [
  "Venue",
  "Food & Drinks",
  "Decorations",
  "Entertainment",
  "Gifts",
  "Logistics",
  "Other",
];

export function ExpenseManager({
  farewellId,
  initialExpenses,
}: ExpenseManagerProps) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [isAdding, setIsAdding] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.category) {
      toast.error("Please fill all fields");
      return;
    }

    setIsAdding(true);
    const res = await createExpenseAction(farewellId, {
      title: formData.title,
      amount: Number(formData.amount),
      category: formData.category,
    });
    setIsAdding(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Expense added successfully");
      setIsOpen(false);
      setFormData({ title: "", amount: "", category: "" });
      // In a real app, we'd fetch updated list or optimistically update.
      // For simplicity, we'll reload or rely on parent revalidation if this was a page.
      // Since it's a client component with initial data, we should probably router.refresh()
      // But let's just do a quick optimistic add for now or refresh
      window.location.reload();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    const res = await deleteExpenseAction(farewellId, id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Expense deleted");
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* We moved the total to the main dashboard, so we keep this clean */}
        <div />
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-white text-black hover:bg-white/90 w-full sm:w-auto font-bold rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <Plus className="w-4 h-4 mr-2" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddExpense} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Catering Advance"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="0.00"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) =>
                    setFormData({ ...formData, category: val })
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-white/90"
                disabled={isAdding}
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add Expense"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <GlassCard className="overflow-hidden border-none bg-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-white/40 uppercase bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Title</th>
                <th className="px-6 py-4 font-bold tracking-wider">Category</th>
                <th className="px-6 py-4 font-bold tracking-wider">Paid By</th>
                <th className="px-6 py-4 text-right font-bold tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-right font-bold tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-white/30 italic"
                  >
                    No expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4 font-medium text-white group-hover:text-primary transition-colors">
                      {expense.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 group-hover:bg-white/10 transition-colors">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/50 text-xs">
                      {expense.users?.full_name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white font-mono">
                      ₹{Number(expense.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(expense.id)}
                        className="text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
