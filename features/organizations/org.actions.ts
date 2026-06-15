"use server";

import { createClient } from "@/lib/supabase/server";
import { createOrganizationSchema, joinOrganizationSchema, createInvitationSchema } from "./org.schemas";
import slugify from "slugify";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createOrganizationAction(prevState: any, formData: FormData) {
  const parsed = createOrganizationSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: (parsed.error as any).errors[0].message, payload: { name: formData.get("name") } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Generate slug
  let slug = slugify(parsed.data.name, { lower: true, strict: true });
  
  // Ensure slug uniqueness (simple implementation, real world might need a loop)
  const { data: existing } = await supabase.from("organizations").select("id").eq("slug", slug).single();
  if (existing) {
    slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
  }

  // We use a Postgres RPC (Stored Procedure) to securely bypass RLS
  // because creating an organization requires inserting into organizations AND organization_members
  // in one atomic step so the user gains SELECT permissions immediately.
  const { data: newOrgId, error: rpcError } = await supabase.rpc("create_new_organization" as any, {
    org_name: parsed.data.name,
    org_slug: slug,
  });

  if (rpcError || !newOrgId) {
    console.error("RPC Error:", rpcError);
    return { error: rpcError?.message || "Failed to create organization via RPC" };
  }

  // Set Cookie
  const cookieStore = await cookies();
  cookieStore.set("active_organization_id", newOrgId as string, { path: "/", httpOnly: true, secure: true });

  revalidatePath("/", "layout");
  redirect(`/${slug}/dashboard`);
}

export async function switchOrganizationAction(organizationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Validate membership
  const { data: membership, error } = await supabase
    .from("organization_members")
    .select("organizations(slug)")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .single();

  if (error || !membership || !membership.organizations) {
    throw new Error("You do not have access to this organization");
  }

  // Update DB preference
  await supabase
    .from("users")
    .update({ last_active_organization_id: organizationId } as any)
    .eq("id", user.id);

  // Set Cookie
  const cookieStore = await cookies();
  cookieStore.set("active_organization_id", organizationId, { path: "/", httpOnly: true, secure: true });

  // Refresh session JWT
  await supabase.auth.refreshSession();

  // Log activity
  await supabase.from("activity_logs").insert({
    organization_id: organizationId,
    actor_id: user.id,
    action: "organization.switched",
  } as any);

  revalidatePath("/", "layout");
  
  const org = Array.isArray(membership.organizations) ? membership.organizations[0] : membership.organizations;
  redirect(`/${org.slug}/dashboard`);
}

export async function joinOrganizationAction(prevState: any, formData: FormData) {
  const parsed = joinOrganizationSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
  });

  if (!parsed.success) {
    return { error: (parsed.error as any).errors[0].message, payload: { inviteCode: formData.get("inviteCode") } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: orgId, error: rpcError } = await supabase.rpc("accept_invitation" as any, {
    invite_token: parsed.data.inviteCode,
  });

  if (rpcError || !orgId) {
    console.error("RPC Error:", rpcError);
    return { error: rpcError?.message || "Invalid or expired invitation code." };
  }

  // Get slug for the organization
  const { data: org } = await supabase.from("organizations").select("slug").eq("id", orgId).single();

  // Set Cookie
  const cookieStore = await cookies();
  cookieStore.set("active_organization_id", orgId as string, { path: "/", httpOnly: true, secure: true });

  revalidatePath("/", "layout");
  redirect(`/${org?.slug}/dashboard`);
}

export async function createInvitationAction(prevState: any, formData: FormData) {
  const parsed = createInvitationSchema.safeParse({
    organizationId: formData.get("organizationId"),
    email: formData.get("email") || undefined,
    role: formData.get("role") || "Member",
  });

  if (!parsed.success) {
    return { error: (parsed.error as any).errors[0].message, payload: { email: formData.get("email") } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Generate a random, readable token (e.g. FW-XYZ-123)
  const token = `FW-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Set expiration to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await (supabase as any)
    .from("organization_invitations")
    .insert({
      organization_id: parsed.data.organizationId,
      email: parsed.data.email || null,
      role: parsed.data.role,
      token: token,
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
      status: "pending"
    })
    .select()
    .single();

  if (error) {
    console.error("Create Invite Error:", error);
    return { error: "Failed to create invitation." };
  }

  revalidatePath("/[slug]/settings/members", "page");
  return { success: true, token };
}
