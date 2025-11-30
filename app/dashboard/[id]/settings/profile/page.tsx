"use client";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions/settings-actions";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { ImageCropper } from "@/components/ui/image-cropper";

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, {
      message: "Username must be at least 2 characters.",
    })
    .max(30, {
      message: "Username must not be longer than 30 characters.",
    }),
  email: z.string().email({ message: "Please select a valid email." }),
  bio: z.string().max(160).min(4).optional(),
  full_name: z.string().min(2).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function ProfileForm({ user }: { user: any }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url);
  const [cropOpen, setCropOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const supabase = createClient();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      bio: user?.bio || "",
      full_name: user?.full_name || "",
    },
    mode: "onChange",
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setSelectedImage(reader.result as string);
        setCropOpen(true);
      });
      reader.readAsDataURL(file);
      // Reset input value so same file can be selected again
      event.target.value = "";
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    try {
      setUploading(true);

      const fileExt = "jpg"; // We export as jpeg in getCroppedImg
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedImageBlob, {
          contentType: "image/jpeg",
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);

      // Auto-save avatar update
      await updateProfile(user.id, {
        avatar_url: data.publicUrl,
      });

      toast.success("Avatar updated");
      router.refresh();
    } catch (error: any) {
      toast.error("Error uploading avatar: " + error.message);
    } finally {
      setUploading(false);
      setSelectedImage(null);
    }
  };

  async function onSubmit(data: ProfileFormValues) {
    try {
      await updateProfile(user.id, {
        username: data.username,
        bio: data.bio,
        full_name: data.full_name,
        avatar_url: avatarUrl, // Include avatarUrl in case it wasn't auto-saved or to be safe
      });
      toast.success("Profile updated", {
        description: "Your profile has been updated successfully.",
      });
      router.refresh();
    } catch (error) {
      toast.error("Failed to update profile");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={avatarUrl || user.avatar_url}
                alt={user.username}
              />
              <AvatarFallback>
                {user.username?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="h-8 w-8 text-white" />
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium leading-none">
              Profile Picture
            </h4>
            <p className="text-sm text-muted-foreground">
              Click on the image to upload a new one.
            </p>
          </div>
        </div>

        <ImageCropper
          open={cropOpen}
          onOpenChange={setCropOpen}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="m@example.com" {...field} disabled />
              </FormControl>
              <FormDescription>
                You cannot change your email address here.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about yourself"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                You can <span>@mention</span> other users and organizations to
                link to them.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Update profile</Button>
      </form>
    </Form>
  );
}

export default function SettingsProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        const { data: dbUser } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();
        setUser({ ...dbUser, email: authUser.email });
        // If avatar_url is missing in dbUser but present in authUser metadata, use that
        if (!dbUser.avatar_url && authUser.user_metadata.avatar_url) {
          setUser((prev: any) => ({
            ...prev,
            avatar_url: authUser.user_metadata.avatar_url,
          }));
        }
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          This is how others will see you on the site.
        </p>
      </div>
      <Separator />
      <ProfileForm user={user} />
    </div>
  );
}
