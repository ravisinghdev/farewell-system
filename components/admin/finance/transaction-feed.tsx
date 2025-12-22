"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useFinance } from "@/components/admin/finance/finance-context";

interface TransactionFeedProps {
  farewellId: string;
}

export function TransactionFeed({ farewellId }: TransactionFeedProps) {
  const { transactions: data, loading, refresh } = useFinance();
  const [search, setSearch] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!search) return data;
    const lower = search.toLowerCase();
    return data.filter(
      (item) =>
        item.user?.full_name?.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower) ||
        String(item.amount).includes(lower)
    );
  }, [data, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Type</TableHead>
              <TableHead>User / Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading financial data...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((tx) => (
                <TableRow key={tx.id} className="group hover:bg-muted/50">
                  <TableCell>
                    {tx.type === "credit" ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {tx.user?.full_name || tx.created_by}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {tx.description || "No description"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="capitalize font-normal text-xs"
                    >
                      {tx.category?.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(tx.created_at), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    <span
                      className={
                        tx.type === "credit"
                          ? "text-emerald-600"
                          : "text-destructive"
                      }
                    >
                      {tx.type === "credit" ? "+" : "-"}
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(tx.amount)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        tx.status === "approved" || tx.status === "verified"
                          ? "default"
                          : "secondary"
                      }
                      className={`capitalize`}
                    >
                      {tx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
