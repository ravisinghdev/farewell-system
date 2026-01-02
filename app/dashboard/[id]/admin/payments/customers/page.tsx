import { getPaymentCustomersAction } from "@/app/actions/payment-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { User } from "lucide-react";

export default async function CustomersPage({ params }: any) {
  const { id } = await params;
  const { customers, error } = await getPaymentCustomersAction(id);

  if (error) {
    return <div>Error loading customers: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">
          People who have made payments via public links.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            List of unique guests and contributors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>First Seen</TableHead>
                {/* <TableHead className="text-right">Total Spent</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers && customers.length > 0 ? (
                customers.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">
                            {c.name || "Unknown"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {c.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{c.email || "-"}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.phone || ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(c.created_at), "MMM d, yyyy")}
                    </TableCell>
                    {/* <TableCell className="text-right">₹{c.total_spent || 0}</TableCell> */}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
