import { getContributionsAction } from "@/app/actions/contribution-actions";
import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import Link from "next/link";

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

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Receipts & Downloads
        </h1>
        <p className="text-muted-foreground">
          View and download receipts for your verified contributions.
        </p>
      </div>

      <div className="grid gap-4">
        {verifiedContributions.length === 0 ? (
          <GlassCard className="p-12 flex flex-col items-center justify-center text-center">
            <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              No Receipts Available
            </h3>
            <p className="text-muted-foreground max-w-sm">
              You haven't made any verified contributions yet. Once your payment
              is verified, your receipt will appear here.
            </p>
          </GlassCard>
        ) : (
          verifiedContributions.map((c) => {
            const userName =
              (Array.isArray((c as any).users)
                ? (c as any).users[0]?.full_name
                : (c as any).users?.full_name) || "Unknown User";
            const userAvatar = Array.isArray((c as any).users)
              ? (c as any).users[0]?.avatar_url
              : (c as any).users?.avatar_url;

            return (
              <GlassCard
                key={c.id}
                className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-lg">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-foreground font-bold text-lg">
                      {userName}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>
                        {format(new Date(c.created_at), "MMMM d, yyyy")}
                      </span>
                      <span>•</span>
                      <span className="capitalize">
                        {c.method.replace("_", " ")}
                      </span>
                      {c.transaction_id && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-muted-foreground/70">
                            ID: {c.transaction_id}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0">
                  <div className="text-right mr-4">
                    <p className="text-2xl font-bold text-foreground">
                      ₹{c.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-emerald-500 font-medium uppercase tracking-wider">
                      {c.status === "approved"
                        ? "Paid & Approved"
                        : "Paid & Verified"}
                    </p>
                  </div>
                  <Link href={`/dashboard/${id}/contributions/receipt/${c.id}`}>
                    <Button
                      variant="outline"
                      className="bg-white/5 border-white/10 text-foreground hover:bg-white/10 gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </Link>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
