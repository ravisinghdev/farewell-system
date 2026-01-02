"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Search,
  CheckCircle,
  XCircle,
  Filter,
  FileText,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import {
  approveContributionAction,
  rejectContributionAction,
  getContributionsPaginatedAction,
  getUnifiedTransactionsAction,
} from "@/app/actions/contribution-actions";
import { getUnifiedTransactions } from "@/app/actions/finance-actions";

export type Transaction = {
  id: string;
  amount: number;
  method: string;
  status: "pending" | "verified" | "rejected" | "approved";
  created_at: string;
  transaction_id: string | null;
  users: {
    full_name: string;
    email?: string;
    avatar_url: string | null;
  } | null;
  metadata?: any;
  // Unified transaction fields
  transaction_type?: "contribution" | "expense";
  entry_type?: "credit" | "debit";
  description?: string | null;
  reference_id?: string | null;
  user?: any;
  user_id?: string;
};

export function TransactionTable({
  farewellId,
  isAdmin = false,
  refreshTrigger = 0,
}: {
  farewellId: string;
  isAdmin?: boolean;
  refreshTrigger?: number;
}) {
  const [data, setData] = React.useState<Transaction[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10); // Page size

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // Filters
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Fetch Data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // For admin, show unified view (contributions + expenses)
      // For regular users, show only contributions
      if (isAdmin) {
        // Use the new, robust action
        const { getUnifiedTransactions } = await import(
          "@/app/actions/finance-actions"
        );

        // Load all data (pass large limit or implement server-pagination properly later)
        // Current implementation fetches limit+offset
        const res = await getUnifiedTransactions(
          farewellId,
          100,
          (page - 1) * 10
        );

        if (res.success && res.data) {
          setData(res.data as any);
          // Total is tricky without count, setting dummy or fetched total if API supported
          setTotal(100); // Placeholder to enable pagination buttons for now
        } else {
          toast.error(res.error || "Failed to load transactions");
        }
      } else {
        const res = await getContributionsPaginatedAction(
          farewellId,
          page,
          limit,
          statusFilter === "all" ? undefined : statusFilter,
          searchQuery
        );
        setData(res.data as any);
        setTotal(res.total);
      }
    } catch (err) {
      toast.error("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  }, [
    farewellId,
    page,
    limit,
    statusFilter,
    searchQuery,
    refreshTrigger,
    isAdmin,
  ]);

  // Initial & Dependent Fetch
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    try {
      const { approveContribution } = await import(
        "@/app/actions/finance-actions"
      );
      const result = await approveContribution(farewellId, id);
      if (result.success) {
        toast.success("Contribution approved successfully");
        fetchData(); // Refresh list
      } else {
        toast.error(result.error || "Failed to approve contribution");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    setIsProcessing(true);
    try {
      const { rejectContribution } = await import(
        "@/app/actions/finance-actions"
      );
      const result = await rejectContribution(farewellId, id);
      if (result.success) {
        toast.success("Contribution rejected");
        fetchData(); // Refresh list
      } else {
        toast.error(result.error || "Failed to reject contribution");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "users.full_name",
      id: "full_name",
      header: "User",
      cell: ({ row }) => {
        // Support both old format (users) and new unified format (user)
        const user = row.original.user || row.original.users;
        return (
          <div className="flex items-center gap-2">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
                {user?.full_name?.charAt(0) || "?"}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {user?.full_name || "Unknown"}
              </span>
              {user?.email && (
                <span className="text-xs text-muted-foreground">
                  {user.email}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const isDebit = row.original.entry_type === "debit";
        const formatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amount);

        return (
          <div
            className={`font-bold ${
              isDebit
                ? "text-destructive"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {isDebit ? "-" : "+"}
            {formatted}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant={
              status === "verified" || status === "approved"
                ? "default"
                : status === "rejected"
                ? "destructive"
                : "secondary"
            }
            className={`capitalize ${
              status === "verified" || status === "approved"
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : ""
            }`}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) => {
        const method = row.getValue("method") as string;
        return (
          <div className="capitalize text-foreground">
            {method ? method.replace(/_/g, " ") : "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => {
        return (
          <div className="text-muted-foreground text-sm">
            {format(new Date(row.getValue("created_at")), "MMM d, yyyy HH:mm")}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const payment = row.original;

        return (
          <div className="flex items-center gap-2">
            {isAdmin && payment.status === "pending" && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                  onClick={() => handleApprove(payment.id)}
                  disabled={isProcessing}
                  title="Approve"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  onClick={() => handleReject(payment.id)}
                  disabled={isProcessing}
                  title="Reject"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(payment.id)}
                >
                  Copy Payment ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={`/dashboard/${farewellId}/contributions/receipt/${payment.id}`}
                    className="cursor-pointer"
                  >
                    View Receipt
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true, // Tell table we handle pagination
    pageCount: Math.ceil(total / limit),
  });

  return (
    <div className="w-full space-y-4">
      {/* Summary Stats removed from here as they should be fetched separately or calculated on server */}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setPage(1); // Reset page on search
              }}
              className="pl-8 bg-background border-input text-foreground"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="ml-auto bg-background border-input capitalize text-foreground hover:bg-secondary"
              >
                <Filter className="w-4 h-4 mr-2" />
                {statusFilter === "all" ? "Status: All" : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {["all", "verified", "approved", "pending", "rejected"].map(
                (s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => {
                      setStatusFilter(s);
                      setPage(1);
                    }}
                    className="capitalize"
                  >
                    {s}{" "}
                    {statusFilter === s && (
                      <CheckCircle className="w-3 h-3 ml-2 text-emerald-500" />
                    )}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="ml-auto bg-background border-input text-foreground hover:bg-secondary"
            >
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border border-border/50 overflow-hidden relative min-h-[300px]">
        <Table>
          <TableHeader className="bg-secondary/20">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-border/50 hover:bg-secondary/40"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-muted-foreground"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-64 text-center"
                >
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : (
              <>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-border/50 hover:bg-secondary/40"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Link
                          href={`/dashboard/${farewellId}/contributions/receipt/${row.original.id}`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Page {page} of {Math.ceil(total / limit) || 1}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="bg-background border-input text-foreground hover:bg-secondary"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / limit) || isLoading}
            className="bg-background border-input text-foreground hover:bg-secondary"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
