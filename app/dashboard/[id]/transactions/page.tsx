import { getAllContributionsAction } from "@/app/actions/contribution-actions";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { TransactionTable } from "@/components/admin/transaction-table";
import { GlassCard } from "@/components/ui/glass-card";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function TransactionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUserWithRole(id);

  if (!user) redirect("/auth");

  const isAdmin =
    user.role === "main_admin" ||
    user.role === "parallel_admin" ||
    user.role === "admin";

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto p-8 animate-in fade-in duration-700">
        <GlassCard className="p-8 text-center space-y-6 border-red-500/20 bg-red-500/5">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Access Denied
            </h1>
            <p className="text-white/60 max-w-md mx-auto">
              You do not have permission to view the transaction history. This
              area is restricted to administrators only.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline" className="border-white/10">
              <Link href={`/dashboard/${id}`}>Return to Dashboard</Link>
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  const transactions = await getAllContributionsAction(id);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Transaction History
        </h1>
        <p className="text-white/60">
          View and manage all transactions from all users.
        </p>
      </div>

      <GlassCard className="p-6">
        <TransactionTable data={transactions as any} farewellId={id} />
      </GlassCard>
    </div>
  );
}
