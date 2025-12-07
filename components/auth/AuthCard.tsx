"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Loader2,
  Eye,
  EyeOff,
  Fingerprint,
  Mail,
  Github,
  Chrome,
  Key,
  ShieldCheck,
  User,
  ArrowRight,
  AlertCircle,
  FileText,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  loginSchema,
  signupSchema,
  LoginInput,
  SignupInput,
} from "@/lib/schemas/auth";
import { loginAction, signupAction } from "@/app/actions/auth-actions";

// Types
type AuthTab = "login" | "signup";

// Animations
const fadeIn = "animate-in fade-in slide-in-from-bottom-4 duration-500";

export function AuthCard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [loading, setLoading] = useState(false);

  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // --- FORMS ---
  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    } as any,
  });

  // Strength Logic
  const passwordValue = signupForm.watch("password") ?? "";
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };
  const strength = getPasswordStrength(passwordValue);

  // Handlers
  async function onLogin(data: LoginInput) {
    setLoading(true);
    try {
      const res = await loginAction(data);
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.redirectUrl) {
        toast.success("Welcome back!");
        router.push(res.redirectUrl);
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function onSignup(data: SignupInput) {
    setLoading(true);
    try {
      const res = await signupAction(data);
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.success) {
        toast.success("Account created! Check your email.");
        setActiveTab("login");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    toast(`Connecting to ${provider}...`);
  }

  return (
    <div className="w-full max-w-5xl relative z-10 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Background Glows (positioned relative to container) */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] -z-10 animate-pulse delay-1000" />

      {/* LEFT COLUMN: AUTH FORM */}
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 mb-4 shadow-lg shadow-primary/25">
            {activeTab === "login" ? (
              <Key className="w-6 h-6 text-white" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground mb-1">
            {activeTab === "login" ? "Welcome Back" : "Join the Future"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {activeTab === "login"
              ? "Access your dashboard"
              : "Create your account"}
          </p>
        </div>

        {/* Custom Tab Switcher */}
        <div className="relative flex p-1 rounded-xl bg-muted/50 mb-6 w-full">
          <div
            className={`absolute inset-y-1 w-[48%] bg-background shadow-sm rounded-lg transition-all duration-300 ease-out ${
              activeTab === "login" ? "left-1" : "left-[51%]"
            }`}
          />
          <button
            onClick={() => setActiveTab("login")}
            className={`relative z-10 flex-1 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "login"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`relative z-10 flex-1 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "signup"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* FORMS */}
        <div className="relative min-h-[320px]">
          {activeTab === "login" ? (
            // --- LOGIN FORM ---
            <div className={fadeIn} key="login">
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onLogin)}
                  className="space-y-4"
                >
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Email</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Mail className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                              {...field}
                              placeholder="Email address"
                              className="pl-10 h-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Password</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Key className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Password"
                              className="pl-10 h-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/25 font-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          ) : (
            // --- SIGNUP FORM ---
            <div className={fadeIn} key="signup">
              <Form {...signupForm}>
                <form
                  onSubmit={signupForm.handleSubmit(onSignup)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={signupForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative group">
                              <User className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input
                                {...field}
                                placeholder="Full Name"
                                className="pl-10 h-10 bg-background/50 border-border/50 rounded-xl"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative group">
                              <Fingerprint className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input
                                {...field}
                                placeholder="Username"
                                className="pl-10 h-10 bg-background/50 border-border/50 rounded-xl"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative group">
                            <Mail className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                              {...field}
                              placeholder="Email"
                              className="pl-10 h-10 bg-background/50 border-border/50 rounded-xl"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative group">
                            <Key className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Password"
                              className="pl-10 h-10 bg-background/50 border-border/50 rounded-xl"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        {/* Strength Indicator */}
                        {passwordValue && (
                          <div className="flex items-center gap-1 mt-1 px-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-colors ${
                                  strength >= i
                                    ? strength > 2
                                      ? "bg-green-500"
                                      : "bg-yellow-500"
                                    : "bg-border"
                                }`}
                              />
                            ))}
                            <span className="text-[10px] text-muted-foreground ml-2">
                              {strength > 3 ? "Strong" : "Weak"}
                            </span>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative group">
                            <ShieldCheck className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                              {...field}
                              type={showConfirm ? "text" : "password"}
                              placeholder="Confirm Password"
                              className="pl-10 h-10 bg-background/50 border-border/50 rounded-xl"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirm(!showConfirm)}
                              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                              {showConfirm ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/25 font-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </div>

        {/* Divider - Reduced spacing as requested */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-medium tracking-wider">
            <span className="bg-black/5 backdrop-blur-sm px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        {/* Social Auth */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            variant="outline"
            className="h-9 text-xs rounded-xl border-border/50 hover:bg-accent/50 hover:border-border transition-colors group"
            onClick={() => handleOAuth("google")}
          >
            <Chrome className="mr-2 h-3.5 w-3.5 group-hover:text-red-500 transition-colors" />{" "}
            Google
          </Button>
          <Button
            variant="outline"
            className="h-9 text-xs rounded-xl border-border/50 hover:bg-accent/50 hover:border-border transition-colors group"
            onClick={() => handleOAuth("github")}
          >
            <Github className="mr-2 h-3.5 w-3.5 group-hover:text-black dark:group-hover:text-white transition-colors" />{" "}
            GitHub
          </Button>
        </div>

        {/* Footer Links */}
        <div className="text-center text-[10px] text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-primary">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-primary">
            Privacy Policy
          </Link>
          .
        </div>
      </div>

      {/* RIGHT COLUMN: RESTORED CONTENT */}
      <div className="hidden lg:flex flex-col gap-6 pt-8 animate-in slide-in-from-right-8 duration-700">
        {/* Security Card */}
        <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 backdrop-blur-sm hover:bg-primary/10 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">Bank-Grade Security</h3>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3 text-sm text-muted-foreground">
              <Lock className="w-4 h-4 mt-0.5 text-primary" />
              <p>End-to-end encryption for all sensitive data and payments.</p>
            </div>
            <div className="flex gap-3 text-sm text-muted-foreground">
              <Fingerprint className="w-4 h-4 mt-0.5 text-primary" />
              <p>Advanced device fingerprinting to detect suspicious logins.</p>
            </div>
          </div>
        </div>

        {/* Pro Tips */}
        <div className="p-6 rounded-3xl bg-card/50 border border-white/5 backdrop-blur-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Pro Tips
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              Use a strong, unique password for your account.
            </li>
            <li className="flex gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              Enable Two-Factor Authentication (2FA) in settings.
            </li>
            <li className="flex gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              Review your active sessions periodically.
            </li>
          </ul>
        </div>

        {/* Trust Statement */}
        <div className="p-4 rounded-xl bg-accent/20 border border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            Trusted by 50+ schools and colleges across the country.
          </p>
        </div>
      </div>
    </div>
  );
}
