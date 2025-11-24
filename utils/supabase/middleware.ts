import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasAnyFarewell } from "@/lib/auth/claims";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // PROTECTED ROUTES LOGIC
  // If user is NOT logged in and tries to access a protected page
  if (!user && !path.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // If user IS logged in
  if (user) {
    // If trying to access auth pages, redirect to dashboard
    if (path.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Check if user has joined a farewell using CUSTOM CLAIMS (Zero Latency)
    // Skip this check for /welcome and /api routes
    if (!path.startsWith("/welcome") && !path.startsWith("/api")) {
      // Use the helper from lib/auth/claims.ts
      // This reads from user.app_metadata which is in the JWT
      const hasFarewell = hasAnyFarewell(user);

      if (!hasFarewell) {
        return NextResponse.redirect(new URL("/welcome", request.url));
      }
    }
  }

  return response;
}
