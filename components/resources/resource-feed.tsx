"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { ResourceCard, ResourceItem } from "./resource-card";
import { ResourceUploader } from "./resource-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { deleteResourceAction } from "@/app/actions/resource-actions";
import { toast } from "sonner";

interface ResourceFeedProps {
  farewellId: string;
  type: "template" | "music" | "download";
  initialResources: ResourceItem[];
}

export function ResourceFeed({
  farewellId,
  type,
  initialResources,
}: ResourceFeedProps) {
  const [resources, setResources] = useState<ResourceItem[]>(initialResources);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  const supabase = createClient();
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell?.role);

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel(`resources_${type}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "resources",
          filter: `farewell_id=eq.${farewellId}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).type !== type) return; // double check type

          if (payload.eventType === "INSERT") {
            setResources((prev) => [payload.new as ResourceItem, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setResources((prev) => prev.filter((r) => r.id !== payload.old.id));
          } else if (payload.eventType === "UPDATE") {
            setResources((prev) =>
              prev.map((r) =>
                r.id === payload.new.id ? (payload.new as ResourceItem) : r
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farewellId, type, supabase]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await deleteResourceAction(id, farewellId, type);
    if (res.error) toast.error(res.error);
    else toast.success("Deleted");
  };

  const filteredResources = resources.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${type}s...`}
            className="pl-10 bg-background/50 backdrop-blur-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isAdmin && (
          <Button
            onClick={() => setIsUploaderOpen(true)}
            className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="mr-2 h-4 w-4" /> Add{" "}
            {type === "music"
              ? "Track"
              : type === "template"
              ? "Template"
              : "File"}
          </Button>
        )}
      </div>

      {/* Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-1"
      >
        <AnimatePresence>
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              item={resource}
              onDelete={handleDelete}
              onPlay={(url) => setPlayingUrl(url === playingUrl ? null : url)}
              isPlaying={playingUrl === resource.file_url}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredResources.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No resources found.</p>
        </div>
      )}

      {/* Uploader Dialog */}
      <ResourceUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        farewellId={farewellId}
        type={type}
        onSuccess={() => {}} // handled by realtime
      />

      {/* Global Player (Hidden implementation details for simplicity, just playing audio) */}
      {playingUrl && (
        <audio
          src={playingUrl}
          autoPlay
          hidden
          onEnded={() => setPlayingUrl(null)}
        />
      )}
    </div>
  );
}
