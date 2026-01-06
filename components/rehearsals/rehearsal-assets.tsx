"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  ExternalLink,
  Link as LinkIcon,
  Plus,
  Trash,
  Music,
  FileText,
  Video,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { updateRehearsalMetadataAction } from "@/app/actions/rehearsal-actions";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { useDropzone } from "react-dropzone";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Asset {
  id: string;
  title: string;
  url: string;
  type: "music" | "doc" | "video" | "other";
}

interface RehearsalAssetsProps {
  rehearsalId: string;
  farewellId: string;
  assets: Asset[]; // From metadata.assets
  metadata: any;
  isAdmin: boolean;
}

export function RehearsalAssets({
  rehearsalId,
  farewellId,
  assets: initialAssets,
  metadata,
  isAdmin,
}: RehearsalAssetsProps) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets || []);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state with props (Critical for Realtime/Refresh consistency)
  useEffect(() => {
    console.log(
      "DEBUG: RehearsalAssets received initialAssets:",
      initialAssets
    );
    if (initialAssets) {
      setAssets(initialAssets);
    }
  }, [initialAssets]);

  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  function detectType(url: string, fileType?: string): Asset["type"] {
    if (
      fileType?.startsWith("audio/") ||
      url.includes("spotify") ||
      url.includes("soundcloud") ||
      url.includes("music")
    )
      return "music";
    if (
      fileType?.startsWith("video/") ||
      url.includes("youtube") ||
      url.includes("vimeo")
    )
      return "video";
    if (
      fileType?.includes("pdf") ||
      url.includes("docs.google") ||
      url.includes("pdf")
    )
      return "doc";
    return "other";
  }

  const getIcon = (type: Asset["type"]) => {
    switch (type) {
      case "music":
        return <Music className="w-5 h-5 text-green-500" />;
      case "doc":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "video":
        return <Video className="w-5 h-5 text-red-500" />;
      default:
        return <LinkIcon className="w-5 h-5 text-muted-foreground" />;
    }
  };

  // Dropzone
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      if (!newTitle) {
        setNewTitle(selectedFile.name.split(".")[0]);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false,
  });

  async function handleAddLink() {
    console.log("DEBUG: handleAddLink", { newTitle, newUrl });
    if (!newTitle || !newUrl) {
      toast.error("Please enter both a title and a URL");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalUrl = newUrl;
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = "https://" + finalUrl;
      }

      const newAsset: Asset = {
        id: crypto.randomUUID(),
        title: newTitle,
        url: finalUrl,
        type: detectType(finalUrl),
      };

      const updatedAssets = [...assets, newAsset];
      await saveAssets(updatedAssets);

      setNewTitle("");
      setNewUrl("");
      toast.success("Resource added successfully");
    } catch (error) {
      toast.error("Failed to add resource");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUploadFile() {
    if (!file || !newTitle) {
      toast.error("Please select a file and enter a title");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(10);

    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `${farewellId}/rehearsal-assets/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("farewell_resources")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      const {
        data: { publicUrl },
      } = supabase.storage.from("farewell_resources").getPublicUrl(filePath);

      const newAsset: Asset = {
        id: crypto.randomUUID(),
        title: newTitle,
        url: publicUrl,
        type: detectType(publicUrl, file.type),
      };

      const updatedAssets = [...assets, newAsset];
      await saveAssets(updatedAssets);

      setFile(null);
      setNewTitle("");
      setUploadProgress(100);
      toast.success("File uploaded successfully");
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error(error.message || "Upload failed");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  }

  async function handleDelete(id: string) {
    const updatedAssets = assets.filter((a) => a.id !== id);
    await saveAssets(updatedAssets);
  }

  async function saveAssets(newAssets: Asset[]) {
    // Optimistic update
    setAssets(newAssets);

    // Send partial update to merge server-side
    const result = await updateRehearsalMetadataAction(
      rehearsalId,
      farewellId,
      {
        assets: newAssets,
      }
    );

    if (result && result.error) {
      throw new Error(result.error);
    }
  }

  const getThumbnail = (url: string, type: Asset["type"]) => {
    if (type === "video") {
      // YouTube
      const ytMatch = url.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      );
      if (ytMatch && ytMatch[1]) {
        return `https://img.youtube.com/vi/${ytMatch[1]}/0.jpg`;
      }
      // Vimeo could be handled via API but complicated without key, skip for now or use generic
    }
    // Direct Image files
    if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      return url;
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4">
          Studio Resources
        </h2>
        <div className="space-y-3">
          {assets.map((asset) => {
            const thumbnail = getThumbnail(asset.url, asset.type);

            // Check if it's an image file type explicitly to force thumbnail mode if missed by regex
            const isImage =
              asset.type === "other" &&
              asset.url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
            const displayThumbnail = thumbnail || (isImage ? asset.url : null);

            return (
              <Card
                key={asset.id}
                className="p-3 flex items-center justify-between group hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => window.open(asset.url, "_blank")}
              >
                <div className="flex items-center gap-4 overflow-hidden w-full">
                  {/* Thumbnail or Icon */}
                  <div className="shrink-0">
                    {displayThumbnail ? (
                      <div className="w-16 h-10 bg-black/10 rounded overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={displayThumbnail}
                          alt={asset.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {asset.type === "video" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Video className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2 bg-muted rounded-full">
                        {getIcon(asset.type)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate text-sm">
                      {asset.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {asset.type}
                      </span>
                      {/* Hidden Raw URL, just show 'Open' indicator on hover if needed or keep clean */}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-50 transition-opacity" />
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(asset.id);
                        }}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {assets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg bg-muted/10">
              No resources added yet.
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div>
          <Card className="bg-transparent overflow-hidden">
            <Tabs defaultValue="link" className="w-full">
              <div className="p-4 border-b bg-muted/30">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="link">External Link</TabsTrigger>
                  <TabsTrigger value="upload">Upload File</TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="link" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label>Resource Title</Label>
                    <Input
                      placeholder="e.g. Spotify Playlist, Google Doc..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input
                      placeholder="https://..."
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleAddLink}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    {isSubmitting ? "Adding..." : "Add Link"}
                  </Button>
                </TabsContent>

                <TabsContent value="upload" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label>Resource Title</Label>
                    <Input
                      placeholder="e.g. Dance Track, Script PDF..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>

                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-6 transition-colors duration-200 cursor-pointer flex flex-col items-center justify-center text-center",
                      isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50",
                      file ? "border-green-500/50 bg-green-500/5" : ""
                    )}
                  >
                    <input {...getInputProps()} />
                    {file ? (
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto">
                          <Music className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium truncate max-w-[200px]">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                          className="text-destructive h-auto p-0 hover:bg-transparent"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto">
                          <UploadCloud className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Click or drag file here
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleUploadFile}
                    disabled={isSubmitting || !file}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    {isSubmitting ? "Uploading..." : "Upload Resource"}
                  </Button>
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>
      )}
    </div>
  );
}
