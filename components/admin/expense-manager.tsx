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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Total Expenses</h3>
          </div>
          <p className="text-3xl font-bold text-white">
            ₹{totalExpenses.toLocaleString()}
          </p>
        </GlassCard>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-bold text-white">Expense List</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-white text-black hover:bg-white/90 w-full sm:w-auto">
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

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-white/40 uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Paid By</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-white/40"
                  >
                    No expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-white">
                      {expense.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full bg-white/10 text-xs text-white/80">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {expense.users?.full_name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white">
                      ₹{Number(expense.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(expense.id)}
                        className="text-white/40 hover:text-red-400 hover:bg-red-400/10"
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
