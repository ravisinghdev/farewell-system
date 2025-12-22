"use client";

import * as React from "react";
import {
  getUnifiedTransactions,
  getPendingContributions,
  Transaction,
} from "@/app/actions/finance-actions";
import { toast } from "sonner";

interface FinanceStats {
  totalCollected: number;
  totalSpent: number;
  pendingAmount: number;
  netBalance: number;
}

interface FinanceContextType {
  transactions: Transaction[];
  queue: Transaction[];
  stats: FinanceStats;
  loading: boolean;
  refresh: () => Promise<void>;
}

const FinanceContext = React.createContext<FinanceContextType | undefined>(
  undefined
);

export function FinanceProvider({
  children,
  farewellId,
}: {
  children: React.ReactNode;
  farewellId: string;
}) {
  const [data, setData] = React.useState<{
    transactions: Transaction[];
    queue: Transaction[];
  }>({ transactions: [], queue: [] });

  const [loading, setLoading] = React.useState(true);

  const fetchAll = React.useCallback(async () => {
    try {
      // Parallel fetch for speed
      const [txRes, queueRes] = await Promise.all([
        getUnifiedTransactions(farewellId, 200), // Fetch last 200 txns
        getPendingContributions(farewellId),
      ]);

      if (txRes.success && txRes.data) {
        // We update state safely
        const transactions = txRes.data;
        const queue = queueRes.success && queueRes.data ? queueRes.data : [];

        setData({ transactions, queue });
      } else {
        console.error("Failed to load finance data", txRes.error);
        toast.error("Failed to sync financial data");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [farewellId]);

  // Initial load
  React.useEffect(() => {
    fetchAll();

    // Optional: Poll every 30s to keep stats fresh without user action
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Derived Stats Calculation
  const stats = React.useMemo(() => {
    const { transactions } = data;

    const totalCollected = transactions
      .filter((t) => t.type === "credit" && t.status === "approved")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSpent = transactions
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0);

    // We calculate pending from the QUEUE to be most accurate about what's waiting
    const pendingAmount = data.queue.reduce((sum, t) => sum + t.amount, 0);

    return {
      totalCollected,
      totalSpent,
      pendingAmount,
      netBalance: totalCollected - totalSpent,
    };
  }, [data]);

  return (
    <FinanceContext.Provider
      value={{
        transactions: data.transactions,
        queue: data.queue,
        stats,
        loading,
        refresh: fetchAll,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = React.useContext(FinanceContext);
  if (context === undefined) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
}
