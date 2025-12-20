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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientCard } from "@/components/ui/gradient-card";
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
          <GlassCard className="px-6 py-3 flex items-center gap-4 bg-emerald-500/10 border-emerald-500/20 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-emerald-200/60 uppercase font-bold tracking-wider">
                Total Verified
              </p>
              <p className="text-2xl font-bold text-foreground">
                ₹{totalVerified.toLocaleString()}
              </p>
            </div>
          </GlassCard>
        )}
      </div>

      <div className="grid gap-6">
        {verifiedContributions.length === 0 ? (
          <GradientCard
            variant="gold"
            className="p-12 min-h-[400px] flex flex-col items-center justify-center text-center relative overflow-hidden border-border/10"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-3xl bg-background/20 backdrop-blur-md flex items-center justify-center mb-6 border border-border/10 shadow-xl rotate-3">
                <Receipt className="w-10 h-10 text-foreground/80" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                No Receipts Yet
              </h3>
              <p className="text-muted-foreground max-w-sm mb-8">
                Your contribution history is empty. Once your payment is
                verified, your official digital receipts will appear here.
              </p>
              <Button
                asChild
                className="rounded-full px-8 h-12 font-bold shadow-lg"
              >
                <Link href={`/dashboard/${id}/contributions/payment`}>
                  Make a Contribution
                </Link>
              </Button>
            </div>
          </GradientCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <GlassCard className="relative overflow-hidden p-0 border border-border/50 bg-card/60 hover:bg-card/80 backdrop-blur-xl transition-all duration-300 group-hover:border-primary/20 group-hover:-translate-y-1 group-hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:group-hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] rounded-3xl">
                    {/* Decorative Top Banner */}
                    <div className="h-2 w-full bg-gradient-to-r from-emerald-500/50 via-emerald-400/50 to-emerald-600/50 opacity-50" />

                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center group-hover:bg-secondary/80 transition-colors">
                            <FileText className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-foreground font-bold text-lg group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                              Contribution Receipt
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono bg-secondary/50 px-1.5 py-0.5 rounded">
                                #{c.id.slice(0, 8)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-200 tracking-wider">
                            Verified
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                            Amount
                          </p>
                          <p className="text-2xl font-bold text-foreground tracking-tight">
                            ₹{c.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                            Date
                          </p>
                          <div className="flex items-center gap-1.5 text-foreground/80 font-medium">
                            <Calendar className="w-3.5 h-3.5 opacity-50" />
                            {format(new Date(c.created_at), "MMM d, yyyy")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border/10">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span className="capitalize">
                            {c.method.replace("_", " ")}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          View Details <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
