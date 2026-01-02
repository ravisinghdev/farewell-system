"use client";

import { useState } from "react";
import { testPermissionsAction } from "@/app/actions/debug-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const res = await testPermissionsAction();
      setResult(res);
    } catch (e) {
      setResult({ error: "Failed to invoke action" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">System Debug</h1>
      <Card>
        <CardHeader>
          <CardTitle>Permission & Connectivity Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Click below to verify that the server can access the
            `rehearsal_sessions` table using the Service Role Key.
          </p>
          <Button onClick={runTest} disabled={loading}>
            {loading ? "Running Checks..." : "Run Diagnostic"}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-slate-950 text-slate-50 rounded-lg overflow-auto font-mono text-sm">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
