"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

export async function getDutiesAction(farewellId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const { data, error } = await supabase
    .from("duties")
    .select(
      `
      *,
      duty_assignments (
        id,
        user_id,
        users (
          full_name,
          avatar_url
        )
      ),
      duty_receipts (
        id,
        amount,
        status,
        created_at
      )
    `
    )
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching duties:", error);
    throw new Error("Failed to fetch duties");
  }

  return data;
}

export async function createDutyAction(
  farewellId: string,
  title: string,
  description: string,
  expenseLimit?: number,
  deadline?: string
) {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("duties")
    .insert({
      farewell_id: farewellId,
      title,
      description,
      expense_limit: expenseLimit,
      deadline,
      created_by: user.id,
    } as any)
    .select()
    .single();

  if (error) {
    console.error("Error creating duty:", error);
    throw new Error("Failed to create duty");
  }

  return data;
}

export async function assignDutyAction(dutyId: string, userIds: string[]) {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data, error } = await supabase.rpc("assign_duty", {
    _duty_id: dutyId,
    _user_ids: userIds,
  } as any);

  if (error) {
    console.error("Error assigning duty:", error);
    throw new Error("Failed to assign duty");
  }

  return data;
}

export async function uploadReceiptAction(
  assignmentId: string,
  amount: number,
  notes: string,
  file: File
) {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Upload file
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `receipts/${assignmentId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("receipts") // Ensure this bucket exists or use a general one
    .upload(filePath, file);

  if (uploadError) {
    console.error("Error uploading receipt file:", uploadError);
    throw new Error("Failed to upload receipt file");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("receipts").getPublicUrl(filePath);

  // Insert receipt record
  const { data, error } = await supabase
    .from("duty_receipts")
    .insert({
      duty_assignment_id: assignmentId,
      uploader_id: user.id,
      amount,
      notes,
      receipt_url: publicUrl,
    } as any)
    .select()
    .single();

  if (error) {
    console.error("Error creating receipt record:", error);
    throw new Error("Failed to create receipt record");
  }

  return data;
}

export async function approveReceiptAction(receiptId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data, error } = await supabase.rpc("approve_duty_receipt", {
    _receipt_id: receiptId,
  } as any);

  if (error) {
    console.error("Error approving receipt:", error);
    throw new Error("Failed to approve receipt");
  }

  return data;
}

export async function rejectReceiptAction(receiptId: string, reason: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data, error } = await supabase.rpc("reject_duty_receipt", {
    _receipt_id: receiptId,
    _reason: reason,
  } as any);

  if (error) {
    console.error("Error rejecting receipt:", error);
    throw new Error("Failed to reject receipt");
  }

  return data;
}
