// components/auth/SignInForm.tsx
"use client";

import React, { useState, useTransition } from "react";
import type { ZodIssue } from "zod";
import { SignInSchema } from "@/utils/validators";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/app/actions/auth-actions";
import { toast } from "sonner";

export default function SignInForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = SignInSchema.safeParse(form);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((i: ZodIssue) => i.message)
        .join(", ");
      setError(message);
      return;
    }

    startTransition(async () => {
      const result = await loginAction(form);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600">{error}</p>}

      <div>
        <Label>Email</Label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>

      <div>
        <Label>Password</Label>
        <Input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
