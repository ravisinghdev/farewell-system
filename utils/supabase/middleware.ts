import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasAnyFarewell } from "@/lib/auth/claims";
import { createClient } from "@supabase/supabase-js";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const { data } = await supabase.auth.getClaims();

  const path = request.nextUrl.pathname;
  const user = data?.claims;

  // PROTECTED ROUTES LOGIC
  // If user is NOT logged in and tries to access a protected page
  if (!data?.claims && !path.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // If user IS logged in
  if (data?.claims) {
    // If trying to access auth pages, redirect to dashboard
    if (path.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Check if user has joined a farewell using CUSTOM CLAIMS (Zero Latency)
    // Skip this check for /welcome and /api routes
    if (!path.startsWith("/welcome") && !path.startsWith("/api")) {
      // This reads from user.app_metadata which is in the JWT
      const hasFarewell = hasAnyFarewell(data?.claims);

      if (!hasFarewell) {
        // FALLBACK: Check DB directly
        // We use a Service Role client if available to bypass RLS, ensuring we don't get false negatives
        let member;

        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
              auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
              },
            }
          );

          const { data } = await adminSupabase
            .from("farewell_members")
            .select("farewell_id")
            .eq("user_id", user?.sub)
            .eq("status", "approved")
            .maybeSingle();
          member = data;
        } else {
          // Fallback to normal client (subject to RLS)
          const { data } = await supabase
            .from("farewell_members")
            .select("farewell_id")
            .eq("user_id", user?.sub)
            .eq("status", "approved")
            .maybeSingle();
          member = data;
        }

        if (!member) {
          return NextResponse.redirect(new URL("/welcome", request.url));
        }
      }
    }
  }

  return response;
}
