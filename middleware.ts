import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // ── Cookie-size guard ──────────────────────────────────────────────
  // Supabase SSR splits the auth JWT into chunked cookies
  // (sb-<ref>-auth-token.0, .1, .2, …). On repeated refreshes stale
  // chunks can accumulate and push the total Cookie header beyond the
  // server's limit → 431 Request Header Fields Too Large.
  const CHUNK_LIMIT = 20;
  const allCookies = request.cookies.getAll();
  const supabaseAuthChunks = allCookies.filter(
    (c) =>
      c.name.startsWith("sb-") &&
      c.name.includes("-auth-token")
  );

  if (supabaseAuthChunks.length > CHUNK_LIMIT) {
    // Redirect to the same URL after clearing the bloated cookies
    const response = NextResponse.redirect(request.url);
    for (const cookie of supabaseAuthChunks) {
      response.cookies.delete(cookie.name);
    }
    return response;
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
