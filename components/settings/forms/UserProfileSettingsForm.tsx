"use client";

import { useState, useTransition, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Camera,
  Lock,
  Bell,
  Palette,
  Moon,
  Sun,
  Monitor,
  LogOut,
  Mail,
  Phone,
  User,
  Shield,
  Check,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { toast } from "sonner";
import { UserPreferences, userPreferencesSchema } from "@/lib/settings/schema";
import { SettingToggle } from "@/components/settings/ui/SettingToggle";
import { updateUserProfileSettingsAction } from "@/app/actions/settings/user-settings-actions";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { AvatarEditorDialog } from "@/components/settings/ui/AvatarEditorDialog";

interface UserProfileSettingsFormProps {
  initialData: {
    full_name: string;
    email: string;
    avatar_url: string | null;
    preferences: UserPreferences;
  };
}

const formSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  avatar_url: z.string().optional(),
  preferences: userPreferencesSchema,
});

type FormValues = z.infer<typeof formSchema>;

export function UserProfileSettingsForm({
  initialData,
}: UserProfileSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editor State
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: initialData.full_name || "",
      avatar_url: initialData.avatar_url || "",
      preferences: initialData.preferences,
    },
  });

  const avatarUrl = form.watch("avatar_url");

  function onSubmit(data: FormValues) {
    startTransition(() => {
      updateUserProfileSettingsAction(data)
        .then((result) => {
          if (result.success) {
            toast.success("Profile updated successfully");
            router.refresh();
          } else {
            toast.error(result.error || "Failed to update profile");
          }
        })
        .catch(() => {
          toast.error("An unexpected error occurred");
        });
    });
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read to data URL for cropping
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setSelectedImageSrc(reader.result?.toString() || null);
      setEditorOpen(true);
    });
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset input
  };

  const handleEditorSave = async (blob: Blob) => {
    setIsUploading(true);
    const supabase = createClient();

    try {
      const fileExt = "jpg";
      const filePath = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      form.setValue("avatar_url", publicUrl, { shouldDirty: true });
      toast.success("Avatar updated. Don't forget to save changes.");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasswordReset = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      initialData.email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings/profile`,
      }
    );
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent!");
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 max-w-4xl pb-24"
      >
        {/* Simple Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Profile</h2>
            <p className="text-sm text-muted-foreground">
              Manage your profile information and preferences.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !form.formState.isDirty}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none space-x-6">
            <TabsTrigger
              value="general"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-2 text-muted-foreground data-[state=active]:text-foreground transition-none shadow-none"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-2 text-muted-foreground data-[state=active]:text-foreground transition-none shadow-none"
            >
              Security
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-2 text-muted-foreground data-[state=active]:text-foreground transition-none shadow-none"
            >
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6 mt-6">
            {/* Avatar Section */}
            <div className="flex items-start gap-6 pb-6 border-b">
              <div className="relative group shrink-0">
                <Avatar className="w-20 h-20 border border-border">
                  <AvatarImage src={avatarUrl || ""} className="object-cover" />
                  <AvatarFallback>
                    {initialData.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </div>
              <div className="space-y-1">
                <h4 className="font-medium">Profile Picture</h4>
                <p className="text-sm text-muted-foreground">
                  Supports JPG, PNG. Click to upload and crop.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 h-8"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload New
                </Button>
              </div>
            </div>

            <div className="grid gap-6 max-w-xl">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your Name"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Please enter your full name, or a display name you are
                      comfortable with.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Email Address</FormLabel>
                <Input
                  value={initialData.email}
                  disabled
                  className="bg-muted text-muted-foreground"
                />
                <p className="text-[0.8rem] text-muted-foreground">
                  This is the email address you use to sign in. It cannot be
                  changed.
                </p>
              </div>

              <FormField
                control={form.control}
                name="preferences.bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us a little about yourself"
                        className="resize-none min-h-[100px]"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of who you are.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferences.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1 234 567 890"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6 mt-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password or recover your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">
                    Run by Supabase Auth
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handlePasswordReset}
                  type="button"
                >
                  Change Password
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-900/50">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Sign out all devices</p>
                  <p className="text-sm text-muted-foreground">
                    Log out of all active sessions.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  type="button"
                >
                  Sign Out All
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-8 mt-6 max-w-2xl">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Appearance</h3>
                <p className="text-sm text-muted-foreground">
                  Customize the interface theme.
                </p>
              </div>
              <Separator />
              <FormField
                control={form.control}
                name="preferences.theme"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: "light", icon: Sun, label: "Light" },
                        { id: "dark", icon: Moon, label: "Dark" },
                        { id: "system", icon: Monitor, label: "System" },
                      ].map((theme) => (
                        <div
                          key={theme.id}
                          onClick={() => field.onChange(theme.id)}
                          className={cn(
                            "cursor-pointer rounded-md border p-4 flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors",
                            field.value === theme.id
                              ? "border-primary bg-muted/50"
                              : "border-border"
                          )}
                        >
                          <theme.icon className="w-5 h-5" />
                          <span className="text-sm font-medium">
                            {theme.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Manage how you receive alerts.
                </p>
              </div>
              <Separator />
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="preferences.notifications.enable_email_notifications"
                  render={({ field }) => (
                    <SettingToggle
                      title="Email Notifications"
                      description="Receive digests and major updates."
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferences.notifications.enable_push_notifications"
                  render={({ field }) => (
                    <SettingToggle
                      title="Push Notifications"
                      description="Receive real-time mobile alerts."
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </form>

      <AvatarEditorDialog
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        imageSrc={selectedImageSrc}
        onSave={handleEditorSave}
      />
    </Form>
  );
}
