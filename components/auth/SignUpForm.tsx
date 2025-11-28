"use client";

import React, { useState, useTransition } from "react";
import type { ZodIssue } from "zod";
import { SignUpSchema } from "@/utils/validators";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signupAction } from "@/app/actions/auth-actions";
import { toast } from "sonner";

export default function SignUpForm() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    fullName: "",
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // validate with Zod
    const parsed = SignUpSchema.safeParse(form);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((i: ZodIssue) => i.message)
        .join(", ");
      setError(message);
      return;
    }

    startTransition(async () => {
      const result = await signupAction(form as any);
      if (result?.error) {
        setError(result.error);
        toast(result.error);
      } else if (result?.success) {
        setSuccess(
          "Account created successfully! Check your email for verification."
        );
        toast.success("Account created successfully!");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}

      <div>
        <Label>Full Name</Label>
        <Input
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
        />
      </div>

      <div>
        <Label>Username (optional)</Label>
        <Input
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
      </div>

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
        {isPending ? "Creating..." : "Create Account"}
      </Button>
    </form>
  );
}
