"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Search,
  Download,
  FileText,
  Filter,
  CheckCircle,
  XCircle,
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
} from "@/app/actions/contribution-actions";

export type Transaction = {
  id: string;
  amount: number;
  method: "upi" | "cash" | "bank_transfer" | "razorpay" | "stripe";
  status: "pending" | "verified" | "rejected" | "approved";
  created_at: string;
  transaction_id: string | null;
  users: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  metadata?: any;
};

export function TransactionTable({
  data,
  farewellId,
  isAdmin = false,
}: {
  data: Transaction[];
  farewellId: string;
  isAdmin?: boolean;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    try {
      const result = await approveContributionAction(id);
      if (result.success) {
        toast.success("Contribution approved successfully");
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
      const result = await rejectContributionAction(id);
      if (result.success) {
        toast.success("Contribution rejected");
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
        const user = row.original.users;
        return (
          <div className="flex items-center gap-2">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                {user?.full_name?.charAt(0) || "?"}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-medium">
                {user?.full_name || "Unknown"}
              </span>
              <span className="text-xs text-muted-foreground">
                {user?.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const formatted = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amount);

        return <div className="font-bold">{formatted}</div>;
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
                ? "default" // Emerald/Green usually
                : status === "rejected"
                ? "destructive"
                : "secondary"
            }
            className={`capitalize ${
              status === "verified" || status === "approved"
                ? "bg-emerald-500 hover:bg-emerald-600"
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
        return (
          <div className="capitalize">
            {(row.getValue("method") as string).replace("_", " ")}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
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

  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    // Simple global filter function
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      if (!value) return false;
      return String(value)
        .toLowerCase()
        .includes(String(filterValue).toLowerCase());
    },
  });

  return (
    <div className="w-full space-y-4">
      {/* Summary Stats */}
      {isAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
            <p className="text-xs text-white/40 uppercase font-bold">Total</p>
            <p className="text-2xl font-bold mt-1">{data.length}</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
            <p className="text-xs text-white/40 uppercase font-bold">
              Verified
            </p>
            <p className="text-2xl font-bold mt-1 text-emerald-400">
              {
                data.filter(
                  (t) => t.status === "verified" || t.status === "approved"
                ).length
              }
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
            <p className="text-xs text-white/40 uppercase font-bold">Pending</p>
            <p className="text-2xl font-bold mt-1 text-amber-400">
              {data.filter((t) => t.status === "pending").length}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
            <p className="text-xs text-white/40 uppercase font-bold">
              Rejected
            </p>
            <p className="text-2xl font-bold mt-1 text-red-400">
              {data.filter((t) => t.status === "rejected").length}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search all columns..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8 bg-white/5 border-white/10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="ml-auto bg-white/5 border-white/10"
              >
                <Filter className="w-4 h-4 mr-2" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("status")?.setFilterValue(undefined)
                }
              >
                All
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("status")?.setFilterValue("verified")
                }
              >
                Verified
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("status")?.setFilterValue("approved")
                }
              >
                Approved
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("status")?.setFilterValue("pending")
                }
              >
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  table.getColumn("status")?.setFilterValue("rejected")
                }
              >
                Rejected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="ml-auto bg-white/5 border-white/10"
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
      <div className="rounded-md border border-white/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-white/10 hover:bg-white/5"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-white/60">
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-white/10 hover:bg-white/5"
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
                      <Button variant="ghost" size="sm">
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
                  className="h-24 text-center text-white/40"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="bg-white/5 border-white/10"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="bg-white/5 border-white/10"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
