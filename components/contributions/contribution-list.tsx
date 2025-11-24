import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/types/supabase";
import { format } from "date-fns";

type Contribution = Database["public"]["Tables"]["contributions"]["Row"];

interface ContributionListProps {
  contributions: Contribution[];
}

export function ContributionList({ contributions }: ContributionListProps) {
  if (contributions.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground border rounded-lg bg-slate-50 dark:bg-slate-900/50">
        No contributions found. Add one to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Txn ID</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contributions.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                {c.created_at
                  ? format(new Date(c.created_at), "MMM d, yyyy")
                  : "-"}
              </TableCell>
              <TableCell className="font-medium">₹{c.amount}</TableCell>
              <TableCell className="capitalize">
                {c.method.replace("_", " ")}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {c.transaction_id || "-"}
              </TableCell>
              <TableCell>
                <StatusBadge status={c.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === "verified") {
    return <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>;
  }
  if (status === "rejected") {
    return <Badge variant="destructive">Rejected</Badge>;
  }
  return <Badge variant="secondary">Pending</Badge>;
}
