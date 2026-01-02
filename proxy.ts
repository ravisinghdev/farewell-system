import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
