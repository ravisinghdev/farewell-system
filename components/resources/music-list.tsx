"use client";

import { useState, useEffect, useRef } from "react";
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
  Play,
  Pause,
  Music2,
  Plus,
  Trash2,
  Search,
  Volume2,
  Upload,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createResourceAction,
  deleteResourceAction,
} from "@/app/actions/resource-actions";
import { checkIsAdmin } from "@/lib/auth/roles";
import { useFarewell } from "@/components/providers/farewell-provider";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  file_url: string;
  category: string;
  created_at: string;
}

interface MusicListProps {
  initialMusic: MusicTrack[];
  farewellId: string;
}

export function MusicList({ initialMusic, farewellId }: MusicListProps) {
  const [music, setMusic] = useState<MusicTrack[]>(initialMusic);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<"file" | "url">("url");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const supabase = createClient();
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell?.role);

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel("resource_music_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "resource_music",
          filter: `farewell_id=eq.${farewellId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMusic((prev) => [payload.new as MusicTrack, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setMusic((prev) => prev.filter((t) => t.id !== payload.old.id));
          } else if (payload.eventType === "UPDATE") {
            setMusic((prev) =>
              prev.map((t) =>
                t.id === payload.new.id ? (payload.new as MusicTrack) : t
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

  function getYouTubeId(url: string) {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  function getThumbnailUrl(url: string) {
    const videoId = getYouTubeId(url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    return null;
  }

  async function handleCreate(formData: FormData) {
    setIsSubmitting(true);
    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;
    const duration = formData.get("duration") as string;
    let file_url = formData.get("file_url") as string;
    const category = "General";

    try {
      if (uploadType === "file" && selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `music/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("farewell_resources")
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("farewell_resources").getPublicUrl(filePath);

        file_url = publicUrl;
      }

      const result = await createResourceAction(farewellId, {
        type: "music",
        title,
        description: artist, // Mapping artist to description for generic resource
        file_path:
          uploadType === "file"
            ? `music/${file_url.split("?")[0].split("/").pop() || ""}`
            : "",
        file_url,
        category,
        metadata: { duration, artist }, // Storing specific metadata
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Track added successfully");
        setIsDialogOpen(false);
        setSelectedFile(null);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this track?")) return;
    const result = await deleteResourceAction(id, farewellId, "music");
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Track deleted");
    }
  }

  const filteredMusic = music.filter(
    (track) =>
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tracks..."
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
                Add Track
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Track</DialogTitle>
              </DialogHeader>
              <form action={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    placeholder="e.g. See You Again"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artist">Artist</Label>
                  <Input
                    id="artist"
                    name="artist"
                    placeholder="e.g. Wiz Khalifa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    name="duration"
                    placeholder="e.g. 3:45"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Audio Source</Label>
                  <Tabs
                    defaultValue="url"
                    value={uploadType}
                    onValueChange={(v) => setUploadType(v as "file" | "url")}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="url">YouTube / URL</TabsTrigger>
                      <TabsTrigger value="file">Upload File</TabsTrigger>
                    </TabsList>
                    <TabsContent value="url" className="pt-2">
                      <div className="relative">
                        <LinkIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="file_url"
                          name="file_url"
                          placeholder="https://youtube.com/..."
                          className="pl-8"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="file" className="pt-2">
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="dropzone-audio"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-semibold">
                                Click to upload
                              </span>{" "}
                              or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {selectedFile
                                ? selectedFile.name
                                : "MP3, WAV (MAX. 10MB)"}
                            </p>
                          </div>
                          <input
                            id="dropzone-audio"
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) =>
                              setSelectedFile(e.target.files?.[0] || null)
                            }
                          />
                        </label>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Adding...
                      </>
                    ) : (
                      "Add Track"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-2">
        {filteredMusic.map((track, index) => {
          const thumbnailUrl = getThumbnailUrl(track.file_url);

          return (
            <div
              key={track.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border bg-card transition-all duration-200 group",
                playingId === track.id
                  ? "border-primary/50 bg-primary/5"
                  : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground w-6 text-center">
                  {playingId === track.id ? (
                    <div className="flex gap-0.5 items-end justify-center h-4">
                      <span className="w-0.5 h-2 bg-primary animate-[music-bar_0.5s_ease-in-out_infinite]" />
                      <span className="w-0.5 h-4 bg-primary animate-[music-bar_0.7s_ease-in-out_infinite]" />
                      <span className="w-0.5 h-3 bg-primary animate-[music-bar_0.6s_ease-in-out_infinite]" />
                    </div>
                  ) : (
                    index + 1
                  )}
                </div>
                <div
                  className={cn(
                    "h-12 w-12 rounded flex items-center justify-center transition-colors overflow-hidden relative",
                    playingId === track.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={track.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Music2 className="h-5 w-5" />
                  )}
                  {playingId === track.id && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Volume2 className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h4
                    className={cn(
                      "font-medium",
                      playingId === track.id && "text-primary"
                    )}
                  >
                    {track.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {track.artist} • {track.duration}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={playingId === track.id ? "default" : "ghost"}
                  size="icon"
                  className="rounded-full"
                  onClick={() => {
                    if (playingId === track.id) {
                      setPlayingId(null);
                    } else {
                      setPlayingId(track.id);
                      window.open(track.file_url, "_blank");
                    }
                  }}
                >
                  {playingId === track.id ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(track.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {filteredMusic.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No music tracks found.
          </div>
        )}
      </div>
    </div>
  );
}
