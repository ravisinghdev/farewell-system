"use client";

import { useActionState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { forgotPasswordAction } from "@/features/auth/auth.actions";
import Link from "next/link";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, action, isPending] = useActionState(
    forgotPasswordAction,
    undefined
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2 min-h-[400px] md:min-h-[600px]">
          <form
            action={action}
            className="p-6 md:p-8 flex flex-col justify-center"
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Reset Password</h1>
                <p className="text-balance text-muted-foreground">
                  Enter your email to receive a password reset link
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  defaultValue={state?.payload?.email}
                />
              </Field>
              {state?.error && (
                <p className="text-sm text-destructive text-center">
                  {state.error}
                </p>
              )}
              {state?.success && (
                <p className="text-sm text-green-600 text-center">
                  {state.success}
                </p>
              )}
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Sending link..." : "Send Reset Link"}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Remember your password? <Link href="/login">Back to login</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
