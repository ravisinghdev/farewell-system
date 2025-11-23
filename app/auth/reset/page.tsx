"use client";

import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleReset(e: any) {
    e.preventDefault();
    setLoading(true);

    const email = e.target.email.value;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/new-password`,
    });

    setLoading(false);

    if (error) alert(error.message);
    else alert("Check your email");
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-background rounded-xl shadow">
      <form onSubmit={handleReset} className="space-y-4">
        <Input name="email" placeholder="Email" />
        <Button disabled={loading} className="w-full">
          Send Reset Link
        </Button>
      </form>
    </div>
  );
}
