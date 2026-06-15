"use client";

import { useActionState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { resetPasswordAction } from "@/features/auth/auth.actions"

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, action, isPending] = useActionState(resetPasswordAction, undefined);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2 min-h-[400px] md:min-h-[600px]">
          <form action={action} className="p-6 md:p-8 flex flex-col justify-center">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create New Password</h1>
                <p className="text-balance text-muted-foreground">
                  Please enter your new password below.
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="password">New Password</FieldLabel>
                <Input id="password" name="password" type="password" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                <Input id="confirmPassword" name="confirmPassword" type="password" required />
              </Field>
              {state?.error && (
                <p className="text-sm text-destructive text-center">
                  {state.error}
                </p>
              )}
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Updating password..." : "Update Password"}
                </Button>
              </Field>
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
  )
}
