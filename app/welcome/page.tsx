"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Farewell {
  id: string;
  title: string;
  year: number;
  section: string;
}

export default function WelcomePage() {
  const [farewells, setFarewells] = useState<Farewell[]>([]);
  const [selectedFarewell, setSelectedFarewell] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchFarewells = async () => {
      const { data, error } = await supabase
        .from("farewells")
        .select("id, title, year, section")
        .eq("status", "active");

      if (error) {
        toast.error("Failed to load farewells");
        console.error(error);
      } else {
        setFarewells(data || []);
      }
      setLoading(false);
    };

    fetchFarewells();
  }, [supabase]);

  const handleJoin = async () => {
    if (!selectedFarewell) return;

    setJoining(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to join a farewell");
        router.push("/auth/signin");
        return;
      }

      const response = await fetch("/api/farewell/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ farewellId: selectedFarewell }),
      });

      if (!response.ok) {
        throw new Error("Failed to join farewell");
      }

      // Refresh session to get updated claims (app_metadata)
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error("Session refresh failed:", refreshError);
      }

      toast.success("Successfully joined farewell!");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Failed to join farewell. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Farewell System</CardTitle>
          <CardDescription>
            Please select your farewell to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">Loading farewells...</div>
          ) : farewells.length === 0 ? (
            <div className="text-center py-4 text-slate-500">
              No active farewells found. Please contact your admin.
            </div>
          ) : (
            <Select onValueChange={setSelectedFarewell} value={selectedFarewell}>
              <SelectTrigger>
                <SelectValue placeholder="Select a farewell" />
              </SelectTrigger>
              <SelectContent>
                {farewells.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.title} ({f.year} - {f.section})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleJoin}
            disabled={!selectedFarewell || joining || loading}
          >
            {joining ? "Joining..." : "Join Farewell"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
