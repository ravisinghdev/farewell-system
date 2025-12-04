"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  FileText,
  Plus,
  Trash2,
  Search,
  File,
  FileImage,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";
import {
  createDownloadAction,
  deleteDownloadAction,
} from "@/app/actions/resource-actions";
import { checkIsAdmin } from "@/lib/auth/roles";
import { useFarewell } from "@/components/providers/farewell-provider";

interface DownloadItem {
  id: string;
  title: string;
  file_url: string;
  file_size: string;
  category: string;
  created_at: string;
}

interface DownloadsListProps {
  initialDownloads: DownloadItem[];
  farewellId: string;
}

export function DownloadsList({
  initialDownloads,
  farewellId,
}: DownloadsListProps) {
  const [downloads, setDownloads] = useState<DownloadItem[]>(initialDownloads);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell?.role);

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel("resource_downloads_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "resource_downloads",
          filter: `farewell_id=eq.${farewellId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setDownloads((prev) => [payload.new as DownloadItem, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setDownloads((prev) => prev.filter((t) => t.id !== payload.old.id));
          } else if (payload.eventType === "UPDATE") {
            setDownloads((prev) =>
              prev.map((t) =>
                t.id === payload.new.id ? (payload.new as DownloadItem) : t
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, supabase]);

  async function handleCreate(formData: FormData) {
    setIsSubmitting(true);
    const title = formData.get("title") as string;
    const file_url = formData.get("file_url") as string;
    const file_size = formData.get("file_size") as string;
    const category = "General";

    const result = await createDownloadAction(farewellId, {
      title,
      file_url,
      file_size,
      category,
    });

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("File added successfully");
      setIsDialogOpen(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this file?")) return;
    const result = await deleteDownloadAction(id, farewellId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("File deleted");
    }
  }

  const filteredDownloads = downloads.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (title: string) => {
    if (title.endsWith(".pdf")) return <FileText className="h-5 w-5" />;
    if (title.endsWith(".jpg") || title.endsWith(".png"))
      return <FileImage className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isAdmin && (
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add File
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New File</DialogTitle>
                </DialogHeader>
                <form action={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      required
                      placeholder="e.g. Event Schedule"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file_size">File Size</Label>
                    <Input
                      id="file_size"
                      name="file_size"
                      placeholder="e.g. 2.4 MB"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file_url">File URL</Label>
                    <Input
                      id="file_url"
                      name="file_url"
                      required
                      placeholder="https://..."
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Adding..." : "Add File"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredDownloads.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card group hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">
                {getFileIcon(item.title)}
              </div>
              <div>
                <h4 className="font-medium">{item.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {item.file_size} •{" "}
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {filteredDownloads.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No downloads found.
          </div>
        )}
      </div>
    </div>
  );
}
