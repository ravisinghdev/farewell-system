"use client";

import { useState, useEffect, useTransition } from "react";
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
import { requestJoinFarewellAction } from "@/app/actions/farewell-join-actions";
import { Loader2 } from "lucide-react";

import { Database } from "@/types/supabase";

type Farewell = Database["public"]["Tables"]["farewells"]["Row"];

export default function WelcomePage() {
  const [farewells, setFarewells] = useState<Farewell[]>([]);
  const [selectedFarewell, setSelectedFarewell] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchFarewells = async () => {
      try {
        // Query 'name' instead of 'title' as per schema
        const { data, error } = await supabase
          .from("farewells")
          .select("*")
          .order("year", { ascending: false });

        if (error) {
          console.error("Fetch farewells error:", error);
          toast.error("Failed to load farewells");
        } else {
          setFarewells(data || []);
        }
      } catch (err) {
        console.error("Unexpected error fetching farewells:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFarewells();
  }, [supabase]);

  const handleJoin = () => {
    if (!selectedFarewell) return;

    startTransition(async () => {
      try {
        const result = await requestJoinFarewellAction(selectedFarewell);

        if (result.status === "error") {
          toast.error(result.message || "Failed to join farewell");
          return;
        }

        if (result.status === "pending") {
          toast.info(
            result.message || "Join request sent! Waiting for approval."
          );
          router.push("/pending-approval");
          return;
        }

        if (result.status === "joined") {
          // Refresh session to ensure claims are updated
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.warn("Session refresh warning:", refreshError);
          }

          toast.success("Successfully joined farewell!");
          router.push(`/dashboard/${result.farewellId}`);
        }
      } catch (error) {
        console.error("Join error:", error);
        toast.error("An unexpected error occurred.");
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Join a Farewell
          </CardTitle>
          <CardDescription className="text-center">
            Select your class farewell to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading farewells...
              </p>
            </div>
          ) : farewells.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-slate-500">No active farewells found.</p>
              <p className="text-xs text-muted-foreground">
                Ask your admin to create one.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Select
                onValueChange={setSelectedFarewell}
                value={selectedFarewell}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your farewell" />
                </SelectTrigger>
                <SelectContent>
                  {farewells.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} ({f.year} - {f.section})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleJoin}
            disabled={!selectedFarewell || isPending || loading}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Farewell"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
