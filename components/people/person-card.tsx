import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Database } from "@/types/supabase";
import { User, Pencil } from "lucide-react";
import { useIsAdmin } from "@/components/providers/farewell-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMemberClassAction } from "@/actions/people";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FarewellMember =
  Database["public"]["Tables"]["farewell_members"]["Row"] & {
    user:
      | (Database["public"]["Tables"]["users"]["Row"] & {
          grade?: number | null;
          section?: string | null;
        })
      | null;
  };

interface PersonCardProps {
  member: FarewellMember;
  farewellId: string;
}

export function PersonCard({ member, farewellId }: PersonCardProps) {
  const user = member.user;
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [editForm, setEditForm] = useState({
    grade: user?.grade || member.grade || "",
    section: user?.section || member.section || "",
    fullName: user?.full_name || "",
    role: member.role,
  });

  if (!user) return null;

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateMemberClassAction(
        user.id,
        editForm.grade ? Number(editForm.grade) : undefined,
        editForm.section,
        editForm.fullName,
        editForm.role,
        farewellId
      );

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Member updated successfully");
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <Card className="overflow-hidden transition-all hover:shadow-md relative group">
        {isAdmin && (
          <div className="absolute top-2 right-2 z-10">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Member Details</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fullName" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="fullName"
                      value={editForm.fullName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, fullName: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Role
                    </Label>
                    <Select
                      value={editForm.role}
                      onValueChange={(val: any) =>
                        setEditForm({ ...editForm, role: val })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="guest">Guest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="grade" className="text-right">
                      Grade
                    </Label>
                    <Input
                      id="grade"
                      type="number"
                      value={editForm.grade}
                      onChange={(e) =>
                        setEditForm({ ...editForm, grade: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="section" className="text-right">
                      Section
                    </Label>
                    <Input
                      id="section"
                      value={editForm.section}
                      onChange={(e) =>
                        setEditForm({ ...editForm, section: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isPending}>
                    {isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
        <CardHeader className="p-0">
          <div className="aspect-square w-full bg-muted/20 relative group">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || "User"}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary/50">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <Badge variant="secondary" className="capitalize">
                {member.role}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg truncate">
            {user.full_name || "Unknown User"}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {user.email || ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(user.grade || member.grade) && (
              <Badge variant="outline" className="text-xs">
                Class {user.grade || member.grade}
              </Badge>
            )}
            {(user.section || member.section) && (
              <Badge variant="outline" className="text-xs">
                Sec {user.section || member.section}
              </Badge>
            )}
          </div>
          {user.status && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={`h-2 w-2 rounded-full ${
                  user.status === "online"
                    ? "bg-green-500"
                    : user.status === "away"
                    ? "bg-yellow-500"
                    : "bg-gray-500"
                }`}
              />
              <span className="capitalize">{user.status}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
