import {
  getFarewellMembersAction,
  getPendingContributionsAction,
} from "@/app/actions/payout-actions";
import { AllocationManager } from "@/components/admin/payment/allocation-manager";
import { VerificationTable } from "@/components/admin/payment/verification-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Copy,
  CreditCard,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RevenueChart } from "@/components/admin/gateway/revenue-chart";
import { getPaymentLinksAction } from "@/app/actions/payment-link-actions";
import { CreateLinkDialog } from "@/components/admin/gateway/create-link-dialog";

// ... existing imports

export default async function PaymentGatewayPage({ params }: any) {
  const { id } = await params;

  // Fetch data in parallel
  const [linksResult, members, pendingRequests] = await Promise.all([
    getPaymentLinksAction(id),
    getFarewellMembersAction(id),
    getPendingContributionsAction(id),
  ]);

  const { links, error } = linksResult;

  if (error) {
    return <div>Error loading payment gateway</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Financial Management
          </h1>
          <p className="text-muted-foreground">
            Manage budget allocations, verify payments, and payment links.
          </p>
        </div>
        <CreateLinkDialog farewellId={id} />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <AllocationManager farewellId={id} users={members} />

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Pending Verifications</CardTitle>
            <CardDescription>
              Verify payment requests from users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VerificationTable requests={pendingRequests} farewellId={id} />
          </CardContent>
        </Card>
      </div>

      {/* Analytics Cards (Placeholder data for now) */}
      <div className="grid gap-4 md:grid-cols-4">
        <RevenueChart farewellId={id} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹0.00</div>
            <p className="text-xs text-muted-foreground">+0% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Links</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {links?.filter((l: any) => l.status === "active").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Links List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Links</CardTitle>
          <CardDescription>
            Active payment links available for public use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {links && links.length > 0 ? (
              links.map((link: any) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{link.title}</h3>
                      <Badge
                        variant={
                          link.status === "active" ? "default" : "secondary"
                        }
                      >
                        {link.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ₹{link.amount} • ID: {link.slug || link.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/pay/${link.slug || link.id}`} target="_blank">
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No payment links created yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LinkIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
