import { getCurrentUserWithRole } from "@/lib/auth/current-user";
import { checkIsAdmin } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, BarChart3, List, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ContributionHeader } from "@/components/contributions/contribution-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerificationQueue } from "@/components/admin/finance/verification-queue";
import { TransactionFeed } from "@/components/admin/finance/transaction-feed";
import { FinanceStats } from "@/components/admin/finance/finance-stats";
import { FinanceProvider } from "@/components/admin/finance/finance-context";
import { createClient } from "@/utils/supabase/server";
import { TrustModeToggle } from "@/components/admin/finance/trust-mode-toggle";

interface ManageContributionsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ManageContributionsPage({
  params,
}: ManageContributionsPageProps) {
  const { id } = await params;
  const user = await getCurrentUserWithRole(id);

  if (!user) redirect("/auth");

  if (!checkIsAdmin(user.role)) {
    return (
      <div className="max-w-3xl mx-auto p-8 animate-in fade-in duration-700">
        <Card className="border-red-500/20 bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-12 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto text-red-600 dark:text-red-500">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-4">
                Restricted Access
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto text-lg">
                This area is reserved for administrators managing the farewell
                finances.
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Button
                asChild
                variant="outline"
                className="h-12 px-8 rounded-xl"
              >
                <Link href={`/dashboard/${id}/contributions`}>
                  Return to Overview
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch farewell payment config
  const supabase = await createClient();
  const { data: farewellData } = await supabase
    .from("farewells")
    .select("payment_config")
    .eq("id", id)
    .single();

  const autoVerify =
    (farewellData?.payment_config as any)?.auto_verify === true;

  return (
    <FinanceProvider farewellId={id}>
      <div className="space-y-8 max-w-[1600px] mx-auto p-4 md:p-8 animate-in fade-in duration-500 pb-12">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
          <ContributionHeader
            title="Finance Command Center"
            description="Verify payments, track expenses, and manage the farewell ledger."
            farewellId={id}
            minimal={true}
          />
          <div className="w-full md:w-auto min-w-[300px]">
            <TrustModeToggle farewellId={id} initialAutoVerify={autoVerify} />
          </div>
        </div>

        <div className="space-y-8">
          {/* Live Pulse Stats */}
          <section>
            <FinanceStats farewellId={id} />
          </section>

          {/* Action Center */}
          <Tabs defaultValue="verification" className="space-y-6">
            <TabsList className="bg-muted p-1 h-auto w-full justify-start overflow-x-auto">
              <TabsTrigger value="verification" className="gap-2 px-4 py-2">
                <CheckCircle2 className="w-4 h-4" />
                Verification Queue
              </TabsTrigger>
              <TabsTrigger value="transactions" className="gap-2 px-4 py-2">
                <List className="w-4 h-4" />
                All Transactions
              </TabsTrigger>
              {/* Future placeholder for detailed analytics/charts */}
              <TabsTrigger
                value="analytics"
                disabled
                className="gap-2 px-4 py-2 opacity-50"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics (Coming Soon)
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="verification"
              className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <div className="flex justify-between items-center px-1">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    Pending Actions
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Review and verify incoming payments.
                  </p>
                </div>
              </div>
              <VerificationQueue farewellId={id} />
            </TabsContent>

            <TabsContent
              value="transactions"
              className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <div className="px-1">
                <h3 className="text-lg font-semibold tracking-tight">
                  Unified Ledger
                </h3>
                <p className="text-sm text-muted-foreground">
                  Complete history of all contributions and expenses.
                </p>
              </div>
              <TransactionFeed farewellId={id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </FinanceProvider>
  );
}
