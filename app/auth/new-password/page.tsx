"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NewPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);

    const password = e.target.password.value;

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) alert(error.message);
    else router.push("/auth/auth");
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-background rounded-xl shadow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="password" type="password" placeholder="New Password" />
        <Button disabled={loading} className="w-full">
          Update Password
        </Button>
      </form>
    </div>
  );
}
