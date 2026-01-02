import { getContributionsAction } from "@/app/actions/contribution-actions";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import {
  Download,
  FileText,
  Receipt,
  CheckCircle2,
  Calendar,
  CreditCard,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ContributionHeader } from "@/components/contributions/contribution-header";
import { cn } from "@/lib/utils";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUserWithRole(id);

  if (!user) redirect("/auth");

  const contributions = await getContributionsAction(id);
  const verifiedContributions = contributions.filter(
    (c) => c.status === "verified" || c.status === "approved"
  );

  const totalVerified = verifiedContributions.reduce(
    (sum, c) => sum + Number(c.amount),
    0
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto p-4 md:p-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <ContributionHeader
          title="Digital Wallet"
          description="Your verified contribution receipts and history."
          farewellId={id}
        />

        {/* Total Summary Badge */}
        {verifiedContributions.length > 0 && (
          <Card className="bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 border-none">
            <CardContent className="px-6 py-3 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-emerald-500 dark:text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-wider">
                  Total Verified
                </p>
                <p className="text-2xl font-bold">
                  ₹{totalVerified.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6">
        {verifiedContributions.length === 0 ? (
          <Card className="min-h-[400px] flex flex-col items-center justify-center text-center border-dashed">
            <CardContent className="flex flex-col items-center pt-6">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
                <Receipt className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Receipts Yet
              </h3>
              <p className="text-muted-foreground max-w-sm mb-8 text-sm">
                Your contribution history is empty. Once your payment is
                verified, your official digital receipts will appear here.
              </p>
              <Button asChild>
                <Link href={`/dashboard/${id}/contributions/payment`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Make a Contribution
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {verifiedContributions.map((c) => {
              const userName =
                (Array.isArray((c as any).users)
                  ? (c as any).users[0]?.full_name
                  : (c as any).users?.full_name) || "Unknown User";

              return (
                <Link
                  href={`/dashboard/${id}/contributions/receipt/${c.id}`}
                  key={c.id}
                  className="group block"
                >
                  <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                          <FileText className="w-5 h-5 text-zinc-500" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold text-foreground">
                            Receipt
                          </CardTitle>
                          <p className="text-xs text-muted-foreground font-mono">
                            #{c.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                      </Badge>
                    </CardHeader>

                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">
                              Amount
                            </p>
                            <p className="text-2xl font-bold tracking-tight">
                              ₹{c.amount.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">
                              Date
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {format(new Date(c.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium capitalize">
                            <CreditCard className="w-3.5 h-3.5" />
                            {c.method.replace("_", " ")}
                          </div>
                          <div className="flex items-center text-xs font-semibold text-primary group-hover:underline">
                            View Details{" "}
                            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
import { Badge } from "@/components/ui/badge";
