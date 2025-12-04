"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutTemplate, Download, Trash2, Search, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  deleteTemplateAction,
  createTemplateAction,
} from "@/app/actions/resource-actions";
import { checkIsAdmin } from "@/lib/auth/roles";
import { useFarewell } from "@/components/providers/farewell-provider";
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
import { Textarea } from "@/components/ui/textarea";

interface Template {
  id: string;
  title: string;
  description: string;
  file_url: string;
  category: string;
  downloads_count: number;
  created_at: string;
  member?: {
    name: string;
    user?: {
      avatar_url: string;
    };
  };
}

interface TemplatesListProps {
  initialTemplates: Template[];
  farewellId: string;
}

export function TemplatesList({
  initialTemplates,
  farewellId,
}: TemplatesListProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell?.role);

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel("resource_templates_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "resource_templates",
          filter: `farewell_id=eq.${farewellId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTemplates((prev) => [payload.new as Template, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setTemplates((prev) => prev.filter((t) => t.id !== payload.old.id));
          } else if (payload.eventType === "UPDATE") {
            setTemplates((prev) =>
              prev.map((t) =>
                t.id === payload.new.id ? (payload.new as Template) : t
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

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this template?")) return;
    const result = await deleteTemplateAction(id, farewellId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Template deleted");
    }
  }

  async function handleCreate(formData: FormData) {
    setIsSubmitting(true);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const file_url = formData.get("file_url") as string;
    const category = "Social Media"; // Default or add select

    const result = await createTemplateAction(farewellId, {
      title,
      description,
      file_url,
      category,
    });

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Template added successfully");
      setIsDialogOpen(false);
    }
  }

  const filteredTemplates = templates.filter((template) =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getThumbnailUrl = (url: string) => {
    if (url.match(/\.(jpeg|jpg|gif|png)$/) != null) {
      return url;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Template</DialogTitle>
              </DialogHeader>
              <form action={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    placeholder="e.g. Instagram Story"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    required
                    placeholder="Brief description..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file_url">Image/File URL</Label>
                  <Input
                    id="file_url"
                    name="file_url"
                    required
                    placeholder="https://..."
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Template"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => {
          const thumbnailUrl = getThumbnailUrl(template.file_url);
          return (
            <div
              key={template.id}
              className="group relative rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden hover:shadow-md transition-all duration-300"
            >
              <div className="aspect-[4/5] bg-muted/50 flex items-center justify-center group-hover:bg-muted/80 transition-colors relative overflow-hidden">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={template.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <LayoutTemplate className="h-16 w-16 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-500" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                    asChild
                  >
                    <a
                      href={template.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Now
                    </a>
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="overflow-hidden">
                    <h3
                      className="font-semibold truncate pr-2"
                      title={template.title}
                    >
                      {template.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {template.category}
                    </p>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 h-10">
                  {template.description}
                </p>

                {/* Uploader Info */}
                <div className="flex items-center gap-2 pt-2 border-t mt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={template.member?.user?.avatar_url} />
                    <AvatarFallback>
                      {template.member?.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {template.member?.name || "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No templates found.
          </div>
        )}
      </div>
    </div>
  );
}
