import type { Metadata } from "next";
import AuthLayout from "@/components/auth/AuthLayout";
import SignInForm from "@/components/auth/SignInForm";

// Page metadata
export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your farewell management account to access your dashboard, contributions, and more.",
};

export default function SignInPage() {
  return (
    <AuthLayout>
      <SignInForm />
    </AuthLayout>
  );
}
