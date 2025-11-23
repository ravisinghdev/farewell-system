import { headers } from "next/headers";
import AuthLayout from "@/components/auth/AuthLayout";
import TwoFactorSetup from "@/components/auth/TwoFactorSetup";

export default async function TwoFactorSetupPage() {
  const h = await headers();
  const userId = h.get("x-auth-user-id");

  if (!userId) {
    // Middleware should protect this route already.
    return <div className="p-6">Authentication required.</div>;
  }

  return <Action userId={userId} />;
}

function Action(userId: any) {
  return (
    <AuthLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
        <TwoFactorSetup userId={userId} />
      </div>
    </AuthLayout>
  );
}
