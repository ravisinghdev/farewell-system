"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
  users?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface TransactionsTableProps {
  transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = transactions.filter((t) => {
    const query = searchQuery.toLowerCase();
    const userName = t.users?.full_name?.toLowerCase() || "";
    const method = t.method?.toLowerCase() || "";
    return userName.includes(query) || method.includes(query);
  });

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              A list of recent contributions and transactions.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-[200px] lg:w-[300px]"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={transaction.users?.avatar_url}
                            alt={transaction.users?.full_name}
                          />
                          <AvatarFallback>
                            {transaction.users?.full_name
                              ?.charAt(0)
                              .toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {transaction.users?.full_name || "Unknown User"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {transaction.method.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.status === "verified"
                            ? "default" // Use default (primary) for verified/success
                            : transaction.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                        className={
                          transaction.status === "verified"
                            ? "bg-green-500 hover:bg-green-600"
                            : ""
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(transaction.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ₹{transaction.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
