"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  UploadCloud,
  Loader2,
  ImagePlus,
  X,
  CheckCircle2,
  FileVideo,
  FileImage,
} from "lucide-react";
import { saveMediaBatchAction } from "@/app/actions/gallery-actions";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadMediaDialogProps {
  farewellId: string;
  albumId: string;
}

export function UploadMediaDialog({
  farewellId,
  albumId,
}: UploadMediaDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    if (validFiles.length !== files.length) {
      toast.warning("Some files were skipped (only images/videos supported).");
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleUpload() {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    const supabase = createClient();
    const uploadedItems: { url: string; type: string }[] = [];
    let failureCount = 0;

    try {
      // 1. Upload all files to Supabase Storage (Client-side)
      const uploadPromises = selectedFiles.map(async (file, index) => {
        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `${albumId}/${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}-${index}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("memories")
            .upload(fileName, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from("memories")
            .getPublicUrl(fileName);

          uploadedItems.push({
            url: publicUrlData.publicUrl,
            type: file.type.startsWith("video/") ? "video" : "image",
          });
        } catch (err) {
          console.error(`Failed to upload ${file.name}`, err);
          failureCount++;
        }
      });

      await Promise.all(uploadPromises);

      if (uploadedItems.length === 0) {
        throw new Error("Failed to upload any files.");
      }

      // 2. Save Metadata to DB (Batch)
      const result = await saveMediaBatchAction(
        farewellId,
        albumId,
        uploadedItems
      );

      if (result.error) {
        throw new Error(result.error);
      }

      if (failureCount > 0) {
        toast.warning(
          `Uploaded ${uploadedItems.length} files. ${failureCount} failed.`
        );
      } else {
        toast.success(
          `Successfully uploaded ${uploadedItems.length} media items!`
        );
      }

      setIsOpen(false);
      setSelectedFiles([]);
    } catch (error: any) {
      console.error("Upload process failed:", error);
      toast.error(error.message || "Upload process failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 shadow-lg shadow-purple-500/20 rounded-xl">
          <UploadCloud className="w-4 h-4 mr-2" /> Upload Media
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl bg-zinc-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Upload to Album</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer min-h-[200px]",
              dragActive
                ? "border-purple-500 bg-purple-500/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isUploading && inputRef.current?.click()}
          >
            <Input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={handleChange}
              disabled={isUploading}
            />

            <div className="w-16 h-16 bg-white/5 text-white/40 rounded-xl flex items-center justify-center mb-3 group-hover:text-white/60 transition-colors">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium text-white mb-1">
              Drag & drop or click to upload
            </p>
            <p className="text-xs text-white/40">
              Supports multiple files (Images & Videos)
            </p>
          </div>

          {/* File List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
              {selectedFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    {file.type.startsWith("video/") ? (
                      <FileVideo className="w-5 h-5 text-pink-400" />
                    ) : (
                      <FileImage className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate text-white/90">
                      {file.name}
                    </p>
                    <p className="text-xs text-white/40">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-red-400/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="w-full bg-white text-black hover:bg-white/90 font-bold rounded-xl h-11"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading{" "}
                {selectedFiles.length} files...
              </>
            ) : (
              `Upload ${
                selectedFiles.length > 0
                  ? selectedFiles.length + " items"
                  : "Files"
              }`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
