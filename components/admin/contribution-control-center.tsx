"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import {
  ShieldAlert,
  Download,
  Settings,
  FileSpreadsheet,
  PlusCircle,
  RefreshCw,
  LayoutDashboard,
  CreditCard,
  Banknote,
  QrCode,
  Save,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionTable } from "@/components/admin/transaction-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { FinancialStats } from "./financial-stats";

interface ContributionControlCenterProps {
  farewellId: string;
  initialStats: any;
  initialSettings?: any;
}

export function ContributionControlCenter({
  farewellId,
  initialStats,
  initialSettings,
}: ContributionControlCenterProps) {
  const [stats, setStats] = useState(
    initialStats || {
      pendingCount: 0,
      collectedAmount: 0,
      targetAmount: 0,
      totalContributors: 0,
    }
  );

  // Settings State using initialSettings
  const [goalAmount, setGoalAmount] = useState(
    initialSettings?.target_amount || stats?.targetAmount || 50000
  );
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(
    initialSettings?.is_maintenance_mode || false
  );
  const [acceptingPayments, setAcceptingPayments] = useState(
    initialSettings?.accepting_payments ?? true
  );
  const [paymentConfig, setPaymentConfig] = useState(
    initialSettings?.payment_config || {
      upi: true,
      cash: true,
      bank_transfer: false,
      upi_id: "",
    }
  );

  const [transactions, setTransactions] = useState<any[]>([]);

  // Data Actions
  const fetchTransactions = async () => {
    const { getAllContributionsAction } = await import(
      "@/app/actions/contribution-actions"
    );
    const data = await getAllContributionsAction(farewellId);
    setTransactions(data);
  };

  const fetchStats = async () => {
    const { getFinancialStatsAction } = await import(
      "@/app/actions/contribution-actions"
    );
    const newStats = await getFinancialStatsAction(farewellId);
    setStats(newStats);
  };

  // Initial Fetch
  useEffect(() => {
    fetchTransactions();
  }, [farewellId]);

  // Realtime Subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("realtime_management")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "farewells",
          filter: `id=eq.${farewellId}`,
        },
        (payload) => {
          const newData = payload.new;
          if (newData) {
            setGoalAmount(newData.target_amount);
            setIsMaintenanceMode(newData.is_maintenance_mode);
            setAcceptingPayments(newData.accepting_payments);
            setPaymentConfig(newData.payment_config);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contributions",
          filter: `farewell_id=eq.${farewellId}`,
        },
        () => {
          fetchStats();
          fetchTransactions();
          toast.info("Data updated from server");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId]);

  const handleSaveSettings = async () => {
    const { updateFarewellSettingsAction } = await import(
      "@/app/actions/contribution-actions"
    );

    toast.promise(
      updateFarewellSettingsAction(farewellId, {
        targetAmount: goalAmount,
        isMaintenanceMode,
        acceptingPayments,
        paymentConfig,
      }),
      {
        loading: "Updating Financial Configuration...",
        success: "Settings saved successfully",
        error: "Failed to save settings",
      }
    );
  };

  const updatePaymentConfig = (key: string, value: any) => {
    setPaymentConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Tabs defaultValue="overview" className="w-full">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <TabsList className="bg-white/5 border border-white/10 p-1 h-12 w-full md:w-auto inline-flex min-w-max">
              <TabsTrigger
                value="overview"
                className="h-10 px-6 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="ledger"
                className="h-10 px-6 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Ledger
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="h-10 px-6 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger
                value="gateways"
                className="h-10 px-6 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Gateways
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
              <PlusCircle className="w-4 h-4 mr-2" />
              Quick Entry
            </Button>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 outline-none">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <GlassCard className="p-6 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent">
              <p className="text-blue-200/60 text-sm font-medium uppercase tracking-wider truncate">
                Pending Review
              </p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-4xl font-bold text-white truncate">
                  {stats?.pendingCount || 0}
                </p>
                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin-slow opacity-50 flex-shrink-0" />
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-300 font-medium">
                <span className="bg-blue-500/20 px-2 py-1 rounded truncate">
                  Action Required
                </span>
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent">
              <p className="text-emerald-200/60 text-sm font-medium uppercase tracking-wider truncate">
                Total Verified
              </p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-bold text-white truncate">
                  ₹{(stats?.collectedAmount || 0).toLocaleString()}
                </p>
                <Banknote className="w-6 h-6 text-emerald-500 opacity-50 flex-shrink-0" />
              </div>
              <div className="mt-4 text-xs text-emerald-300 font-medium truncate">
                Synced to Ledger
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent">
              <p className="text-amber-200/60 text-sm font-medium uppercase tracking-wider truncate">
                Goal Progress
              </p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-bold text-white truncate">
                  {(
                    ((stats?.collectedAmount || 0) / (goalAmount || 1)) *
                    100
                  ).toFixed(1)}
                  %
                </p>
                <div
                  className="radial-progress text-amber-500 text-xs flex-shrink-0"
                  style={
                    {
                      "--value":
                        ((stats?.collectedAmount || 0) / (goalAmount || 1)) *
                        100,
                      "--size": "1.5rem",
                    } as any
                  }
                />
              </div>
              <div className="mt-4 w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-1000"
                  style={{
                    width: `${
                      ((stats?.collectedAmount || 0) / (goalAmount || 1)) * 100
                    }%`,
                  }}
                />
              </div>
            </GlassCard>

            <GlassCard className="p-6 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent">
              <p className="text-purple-200/60 text-sm font-medium uppercase tracking-wider truncate">
                Contributors
              </p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-4xl font-bold text-white truncate">
                  {stats?.totalContributors || 0}
                </p>
                <Settings className="w-6 h-6 text-purple-500 opacity-50 flex-shrink-0" />
              </div>
              <div className="mt-4 text-xs text-purple-300 font-medium truncate">
                Active Members
              </div>
            </GlassCard>
          </div>

          {/* Quick Stats/Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6 h-[400px]">
              <h3 className="font-bold text-white mb-4">
                Financial Health Overview
              </h3>
              <FinancialStats initialStats={stats} farewellId={farewellId} />
            </GlassCard>
            <GlassCard className="p-6 h-[400px] flex items-center justify-center border-dashed border-2 border-white/10 bg-transparent">
              <div className="text-center space-y-2 opacity-50">
                <LayoutDashboard className="w-12 h-12 mx-auto" />
                <p>Advanced Analytics Pending</p>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        {/* Ledger Tab */}
        <TabsContent value="ledger" className="outline-none">
          <GlassCard className="border-t-4 border-t-emerald-500 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Master Transaction Ledger
                  </h3>
                  <p className="text-sm text-white/40">
                    View, verify, and audit all financial records.
                  </p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-white/60">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh Data
              </Button>
            </div>
            <div className="p-6">
              <TransactionTable
                farewellId={farewellId}
                data={transactions}
                isAdmin={true}
              />
            </div>
          </GlassCard>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent
          value="settings"
          className="outline-none max-w-4xl mx-auto"
        >
          <div className="grid gap-6">
            <GlassCard className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    System Configuration
                  </h3>
                  <p className="text-white/40">
                    Manage global settings for the contribution module.
                  </p>
                </div>
                <div className="p-3 bg-white/5 rounded-full">
                  <Settings className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="space-y-8">
                <div className="grid gap-2">
                  <Label className="text-white">Target Goal Amount (₹)</Label>
                  <p className="text-sm text-white/40 mb-2">
                    Set the total collection target for this farewell.
                  </p>
                  <div className="flex gap-4">
                    <Input
                      type="number"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(Number(e.target.value))}
                      className="bg-white/5 border-white/10 text-white font-mono text-lg max-w-[300px]"
                    />
                    <Button
                      onClick={handleSaveSettings}
                      className="bg-emerald-500 text-white"
                    >
                      Update Goal
                    </Button>
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-white text-base">
                      Accept New Contributions
                    </Label>
                    <p className="text-sm text-white/40">
                      If disabled, users will see a "Contributions Closed"
                      message.
                    </p>
                  </div>
                  <Switch
                    checked={acceptingPayments}
                    onCheckedChange={setAcceptingPayments}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

                <div className="h-px bg-white/10" />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-white text-base">
                      Maintenance Mode
                    </Label>
                    <p className="text-sm text-white/40">
                      Hide the contribution section entirely from non-admin
                      users.
                    </p>
                  </div>
                  <Switch
                    checked={isMaintenanceMode}
                    onCheckedChange={setIsMaintenanceMode}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                <Button
                  size="lg"
                  onClick={handleSaveSettings}
                  className="bg-white text-black hover:bg-white/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save All Changes
                </Button>
              </div>
            </GlassCard>

            <GlassCard className="p-8 border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-4 text-red-400 mb-4">
                <ShieldAlert className="w-6 h-6" />
                <h3 className="font-bold">Danger Zone</h3>
              </div>
              <p className="text-red-300/60 mb-6 text-sm">
                Irreversible actions that affect financial data.
              </p>
              <div className="flex gap-4">
                <Button
                  variant="destructive"
                  className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                >
                  Reset All Stats
                </Button>
                <Button
                  variant="destructive"
                  className="bg-red-500 hover:bg-red-600"
                >
                  Close Farewell Finance
                </Button>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        {/* Gateways Tab */}
        <TabsContent
          value="gateways"
          className="outline-none max-w-4xl mx-auto"
        >
          <GlassCard className="p-8 space-y-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Payment Methods
                </h3>
                <p className="text-white/40">
                  Configure accepted payment types and details.
                </p>
              </div>
              <Button
                onClick={handleSaveSettings}
                className="bg-emerald-500 text-white"
              >
                <Save className="w-4 h-4 mr-2" /> Save Config
              </Button>
            </div>

            <div className="grid gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-white truncate">
                      UPI / QR Code
                    </p>
                    <p className="text-sm text-white/40 truncate max-w-[200px] md:max-w-none">
                      Accept payments via GPay, PhonePe, Paytm
                    </p>
                  </div>
                </div>
                <Switch
                  checked={paymentConfig.upi}
                  onCheckedChange={(checked) =>
                    updatePaymentConfig("upi", checked)
                  }
                  className="data-[state=checked]:bg-green-500"
                />
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/20 rounded-lg text-green-400">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-white truncate">
                      Cash Collection
                    </p>
                    <p className="text-sm text-white/40 truncate max-w-[200px] md:max-w-none">
                      Allow manual cash entry for offline payments
                    </p>
                  </div>
                </div>
                <Switch
                  checked={paymentConfig.cash}
                  onCheckedChange={(checked) =>
                    updatePaymentConfig("cash", checked)
                  }
                  className="data-[state=checked]:bg-green-500"
                />
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-white truncate">
                      Bank Transfer (IMPS/NEFT)
                    </p>
                    <p className="text-sm text-white/40 truncate max-w-[200px] md:max-w-none">
                      Direct bank account transfers
                    </p>
                  </div>
                </div>
                <Switch
                  checked={paymentConfig.bank_transfer}
                  onCheckedChange={(checked) =>
                    updatePaymentConfig("bank_transfer", checked)
                  }
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-white/10">
              <Label className="text-white mb-2 block">
                UPI ID for Collection
              </Label>
              <div className="flex gap-4">
                <Input
                  value={paymentConfig.upi_id || ""}
                  onChange={(e) =>
                    updatePaymentConfig("upi_id", e.target.value)
                  }
                  placeholder="example@oksbi"
                  className="bg-white/5 border-white/10 text-white"
                />
                <Button
                  onClick={handleSaveSettings}
                  className="bg-white text-black hover:bg-white/90"
                >
                  Update UPI
                </Button>
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
