"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function WelcomeContent() {
  const [farewells, setFarewells] = useState<Farewell[]>([]);
  const [selectedFarewell, setSelectedFarewell] = useState<string>("");
  const [existingFarewellId, setExistingFarewellId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      toast.success("Email verified successfully!");
      router.replace("/welcome");
    }
  }, [searchParams, router]);

  useEffect(() => {
    const fetchFarewells = async () => {
      try {
        const { data, error } = await supabase
          .from("farewells")
          .select("*")
          .order("year", { ascending: false });

        if (error) {
          console.error("Fetch farewells error:", error);
          toast("Failed to load farewells");
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

  // Check if user is already logged in and has a farewell
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Check claims first
        const claims = user.app_metadata?.farewells;
        if (claims && Object.keys(claims).length > 0) {
          setExistingFarewellId(Object.keys(claims)[0]);
          return;
        }

        // Fallback: Check DB
        const { data: member } = await supabase
          .from("farewell_members")
          .select("farewell_id")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .maybeSingle();

        if (member) {
          setExistingFarewellId(member.farewell_id);
        }
      }
    };

    checkAuth();
  }, [supabase]);

  const handleJoin = () => {
    if (!selectedFarewell) return;

    startTransition(async () => {
      try {
        const result = await requestJoinFarewellAction(selectedFarewell);

        if (result.error) {
          toast(result.error || "Failed to join farewell");
          return;
        }

        const status = result.data?.status;

        if (status === "pending") {
          toast.info(
            result.error || "Join request sent! Waiting for approval."
          );
          router.push("/pending-approval");
          return;
        }

        if (status === "joined") {
          // Refresh session to ensure claims are updated
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.warn("Session refresh warning:", refreshError);
          }

          toast.success("Successfully joined farewell!");
          router.push(`/dashboard/${result.data?.farewellId}`);
        }
      } catch (error) {
        console.error("Join error:", error);
        toast("An unexpected error occurred.");
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/50 backdrop-blur-sm bg-background/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Join a Farewell
          </CardTitle>
          <CardDescription className="text-center text-base">
            Select your class farewell to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {existingFarewellId ? (
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                <p className="text-green-800 dark:text-green-200 font-medium">
                  You are already a member of a farewell!
                </p>
              </div>
              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={() => router.push(`/dashboard/${existingFarewellId}`)}
              >
                Continue to Dashboard
              </Button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Loading farewells...
              </p>
            </div>
          ) : farewells.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
              No active farewells found.
            </div>
          ) : (
            <div className="space-y-4">
              <Select
                onValueChange={setSelectedFarewell}
                value={selectedFarewell}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select your farewell" />
                </SelectTrigger>
                <SelectContent>
                  {farewells.map((f) => (
                    <SelectItem
                      key={f.id}
                      value={f.id}
                      className="cursor-pointer py-3"
                    >
                      <span className="font-medium">{f.name}</span>
                      <span className="ml-2 text-muted-foreground text-sm">
                        ({f.year})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                onClick={handleJoin}
                disabled={!selectedFarewell || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Farewell"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
