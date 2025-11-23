// lib/auth/current-user.ts
import { createClient } from "@/utils/supabase/server";
import { getUserRoleFromDb, type UserRoleName } from "./roles-db";

export interface AuthUserWithRole {
  id: string;
  email: string;
  role: UserRoleName;
  raw: any;
}

export async function getCurrentUserWithRole(): Promise<AuthUserWithRole | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) return null;

  const user = data.user;
  const role = await getUserRoleFromDb(user.id);

  return {
    id: user.id,
    email: user.email ?? "",
    role,
    raw: user,
  };
}
