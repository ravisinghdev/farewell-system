import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { farewellId } = await request.json();

    if (!farewellId) {
      return NextResponse.json(
        { error: "Farewell ID is required" },
        { status: 400 }
      );
    }

    // Check if farewell exists and is active
    const { data: farewell, error: farewellError } = await supabase
      .from("farewells")
      .select("id")
      .eq("id", farewellId)
      .eq("status", "active")
      .single();

    if (farewellError || !farewell) {
      return NextResponse.json(
        { error: "Farewell not found or inactive" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("farewell_members")
      .select("user_id")
      .eq("farewell_id", farewellId)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { message: "Already a member" },
        { status: 200 }
      );
    }

    // Add user to farewell_members
    const { error: joinError } = await supabase
      .from("farewell_members")
      .insert({
        farewell_id: farewellId,
        user_id: user.id,
        role: "student", // Default role
        active: true,
      });

    if (joinError) {
      console.error("Join error:", joinError);
      return NextResponse.json(
        { error: "Failed to join farewell" },
        { status: 500 }
      );
    }

    // Auto-join class chat group (if exists)
    const { data: classGroup } = await supabase
      .from("chat_groups")
      .select("id")
      .eq("farewell_id", farewellId)
      .eq("type", "class_group")
      .single();

    if (classGroup) {
      await supabase.from("chat_members").insert({
        group_id: classGroup.id,
        user_id: user.id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
