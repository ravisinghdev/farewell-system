"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  Fingerprint,
  Mail,
  Github,
  Chrome,
  Key,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  loginSchema,
  signupSchema,
  LoginInput,
  SignupInput,
} from "@/lib/schemas/auth";
import { loginAction, signupAction } from "@/app/actions/auth-actions";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

type PasswordStrength = "weak" | "medium" | "strong" | "empty";

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "empty";
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return "weak";
  if (score === 2 || score === 3) return "medium";
  return "strong";
}

function strengthLabel(strength: PasswordStrength) {
  switch (strength) {
    case "weak":
      return "Weak";
    case "medium":
      return "Medium";
    case "strong":
      return "Strong";
    default:
      return "";
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export function AuthCard() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<boolean | null>(null);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  // --- LOGIN FORM SETUP ----------------------------------------------------
  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onLoginSubmit(data: LoginInput) {
    setLoginError(null);
    setLoginLoading(true);

    try {
      const result = await loginAction({ ...data, rememberMe });

      if (result?.error) {
        setLoginError(result.error);
        toast("Login Failed", {
          description: result.error,
          action: { label: "Close", onClick: () => toast.dismiss() },
        });
      }
      // if loginAction redirects, we might never hit this line in production
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Unexpected error. Please try again.");
      toast("Unexpected Error", {
        description: "Something went wrong during login.",
      });
    } finally {
      setLoginLoading(false);
    }
  }

  // --- SIGNUP FORM SETUP ---------------------------------------------------
  const signupForm = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    } as any, // fullName may be optional in your schema
  });

  const passwordValue = signupForm.watch("password") ?? "";
  const passwordStrength = getPasswordStrength(passwordValue);

  async function onSignupSubmit(data: SignupInput) {
    setSignupError(null);
    setSignupSuccess(null);
    setSignupLoading(true);

    try {
      const result = await signupAction(data);

      if (result?.error) {
        setSignupError(result.error);
        toast("Signup Failed", {
          description: result.error,
          action: { label: "Close", onClick: () => toast.dismiss() },
        });
      } else if (result?.success) {
        const msg =
          result.success ??
          "Account created! Please check your email to verify your account.";
        setSignupSuccess(msg);
        toast("Signup Successful!", {
          description: msg,
        });

        // OPTIONAL: switch to login tab after success
        setActiveTab("login");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setSignupError("Unexpected error. Please try again.");
      toast("Unexpected Error", {
        description: "Something went wrong during signup.",
      });
    } finally {
      setSignupLoading(false);
    }
  }

  // --- OAUTH HANDLER (placeholder) -----------------------------------------
  async function handleOAuth(provider: "google" | "github") {
    toast("OAuth not implemented", {
      description: `Hook your ${provider} OAuth logic into handleOAuth().`,
    });
    // Here you could call a server action or redirect to Supabase OAuth:
    // await oauthLogin(provider)
  }

  /* ---------------------------------------------------------------------- */

  return (
    <div className="flex h-screen w-full items-center justify-center ">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-8 px-4 md:grid-cols-[1.2fr_0.9fr]">
        {/* LEFT: AUTH TABS --------------------------------------------------- */}
        <div className="flex flex-col justify-center">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "login" | "signup")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Register</TabsTrigger>
            </TabsList>

            {/* LOGIN TAB ----------------------------------------------------- */}
            <TabsContent value="login">
              <Card className="mt-4 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-primary" />
                    Welcome back
                  </CardTitle>
                  <CardDescription>
                    Sign in to access your Farewell dashboard, devices and
                    ongoing contributions.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {loginError && (
                    <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {loginError}
                    </div>
                  )}

                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="you@example.com"
                                  type="email"
                                  autoComplete="email"
                                  {...field}
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Key className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  type={showLoginPassword ? "text" : "password"}
                                  autoComplete="current-password"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                                  onClick={() =>
                                    setShowLoginPassword((prev) => !prev)
                                  }
                                  aria-label={
                                    showLoginPassword
                                      ? "Hide password"
                                      : "Show password"
                                  }
                                >
                                  {showLoginPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-3 w-3 rounded border"
                            checked={rememberMe}
                            onChange={(e) =>
                              setRememberMe(e.currentTarget.checked)
                            }
                          />
                          <span>Remember this device</span>
                        </label>

                        <button
                          type="button"
                          className="text-xs text-primary underline-offset-2 hover:underline"
                          onClick={() =>
                            toast("Forgot password flow not wired yet in UI.")
                          }
                        >
                          Forgot password?
                        </button>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginLoading}
                      >
                        {loginLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in…
                          </>
                        ) : (
                          "Sign in"
                        )}
                      </Button>
                    </form>
                  </Form>

                  <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    <span>or continue with</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => handleOAuth("google")}
                    >
                      <Chrome className="h-4 w-4" />
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => handleOAuth("github")}
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </Button>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col items-start gap-1 text-xs text-muted-foreground">
                  <span>
                    By signing in you agree to our{" "}
                    <button
                      type="button"
                      className="underline"
                      onClick={() =>
                        toast("Terms", {
                          description:
                            "Add your Terms of Service and Privacy Policy pages.",
                        })
                      }
                    >
                      Terms & Privacy
                    </button>
                    .
                  </span>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* SIGNUP TAB ---------------------------------------------------- */}
            <TabsContent value="signup">
              <Card className="mt-4 shadow-lg">
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Set up your secure Farewell account with advanced
                    protections.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {signupError && (
                    <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {signupError}
                    </div>
                  )}

                  {signupSuccess && (
                    <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                      {signupSuccess}
                    </div>
                  )}

                  <Form {...signupForm}>
                    <form
                      onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                      className="space-y-4"
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        <FormField
                          control={signupForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="cool_student"
                                  autoComplete="username"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={signupForm.control}
                          name={"fullName" as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ravi Singh"
                                  autoComplete="name"
                                  {...field}
                                />
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
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-3 md:grid-cols-2">
                        <FormField
                          control={signupForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={
                                      showSignupPassword ? "text" : "password"
                                    }
                                    autoComplete="new-password"
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                                    onClick={() =>
                                      setShowSignupPassword((prev) => !prev)
                                    }
                                  >
                                    {showSignupPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={signupForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={
                                      showSignupConfirm ? "text" : "password"
                                    }
                                    autoComplete="new-password"
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                                    onClick={() =>
                                      setShowSignupConfirm((prev) => !prev)
                                    }
                                  >
                                    {showSignupConfirm ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Password strength meter & checklist */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Password strength
                          </span>
                          <span
                            className={
                              passwordStrength === "strong"
                                ? "text-emerald-600"
                                : passwordStrength === "medium"
                                ? "text-amber-600"
                                : passwordStrength === "weak"
                                ? "text-red-600"
                                : "text-muted-foreground"
                            }
                          >
                            {strengthLabel(passwordStrength)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={
                              "h-full transition-all " +
                              (passwordStrength === "strong"
                                ? "w-full bg-emerald-500"
                                : passwordStrength === "medium"
                                ? "w-2/3 bg-amber-500"
                                : passwordStrength === "weak"
                                ? "w-1/3 bg-red-500"
                                : "w-0")
                            }
                          />
                        </div>

                        <ul className="grid gap-1 text-[11px] text-muted-foreground md:grid-cols-2">
                          <li>
                            • At least{" "}
                            <span className="font-medium">8 characters</span>
                          </li>
                          <li>• At least one uppercase letter</li>
                          <li>• At least one number</li>
                          <li>• At least one symbol</li>
                        </ul>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={signupLoading}
                      >
                        {signupLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account…
                          </>
                        ) : (
                          "Create account"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>

                <CardFooter className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="text-primary underline"
                      onClick={() => setActiveTab("login")}
                    >
                      Sign in
                    </button>
                  </span>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT: SECURITY / FEATURE PANEL ----------------------------------- */}
        <div className="hidden flex-col justify-center gap-4 md:flex">
          <Card className="border-primary/20 bg-primary/5 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Futuristic Security
              </CardTitle>
              <CardDescription>
                Your account is protected by a multi-layer security stack.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="font-semibold">Multi-factor ready</span>
                <p className="text-muted-foreground">
                  Enable TOTP 2FA and Passkeys from your security settings to
                  lock down your account like a pro.
                </p>
              </div>
              <div>
                <span className="font-semibold">Device intelligence</span>
                <p className="text-muted-foreground">
                  Every login is associated with a device fingerprint. You can
                  revoke any suspicious device in real time.
                </p>
              </div>
              <div>
                <span className="font-semibold">Session hygiene</span>
                <p className="text-muted-foreground">
                  Short-lived tokens, forced rotation, and anomaly detection
                  keep you safe against token theft.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-sm">Pro tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <ul className="space-y-1 list-disc pl-4">
                <li>Use a unique password you don’t use anywhere else.</li>
                <li>Turn on 2FA after your first login.</li>
                <li>
                  Avoid signing in from shared or public computers whenever
                  possible.
                </li>
                <li>
                  We’ll alert you by email if we detect a login from a new
                  location.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
