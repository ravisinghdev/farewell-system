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
import { UploadCloud, Loader2, ImagePlus, X, CheckCircle2 } from "lucide-react";
import { saveMediaRecordAction } from "@/app/actions/gallery-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

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
  const [progress, setProgress] = useState(0); // Progress percentage
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Please upload an image or video file.");
      return;
    }
    // No hard limit on client-side upload size here, Supabase handles it (default 50MB-5GB depending on plan).
    // Let's warn if HUGE but allow it.
    if (file.size > 1024 * 1024 * 1024) {
      toast.warning("File is over 1GB, upload may take a while.");
    }
    setSelectedFile(file);
  };

  async function handleUpload() {
    if (!selectedFile) return;

    setIsUploading(true);
    setProgress(0);
    const supabase = createClient();

    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${albumId}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;

      // 1. Direct Upload to Storage
      const { data, error } = await supabase.storage
        .from("memories")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: false,
          // Supabase JS doesn't expose native XHR progress easily in upload() wrapper yet without TUS in some versions,
          // but we can fake progress or use TUS if enabled.
          // For standard upload, it waits. Let's simulate distinct phases.
        });

      if (error) throw error;

      setProgress(50); // Upload done, saving record

      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from("memories")
        .getPublicUrl(fileName);

      // 3. Save Record via Server Action
      const type = selectedFile.type.startsWith("video/") ? "video" : "image";
      const result = await saveMediaRecordAction(
        albumId,
        farewellId,
        publicUrlData.publicUrl,
        type
      );

      if (result.error) {
        throw new Error(result.error);
      }

      setProgress(100);
      toast.success("Media uploaded successfully!");
      setIsOpen(false);
      setSelectedFile(null);
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error(error.message || "Upload failed");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 shadow-lg shadow-purple-500/20 rounded-xl">
          <UploadCloud className="w-4 h-4 mr-2" /> Upload Media
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10 text-white">
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
              accept="image/*,video/*"
              className="hidden"
              onChange={handleChange}
              disabled={isUploading}
            />

            {selectedFile ? (
              <div className="relative w-full">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center mb-3 mx-auto">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8" />
                  )}
                </div>
                <p className="text-sm font-medium text-emerald-400 mb-1">
                  {isUploading ? "Uploading..." : "Ready to upload"}
                </p>
                <p className="text-xs text-white/60 truncate max-w-[200px] mx-auto">
                  {selectedFile.name}
                </p>

                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 text-white/40 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-white/5 text-white/40 rounded-xl flex items-center justify-center mb-3 group-hover:text-white/60 transition-colors">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium text-white mb-1">
                  Drag & drop or click to upload
                </p>
                <p className="text-xs text-white/40">
                  Supports High Quality Images & Videos
                </p>
              </>
            )}
          </div>

          {/* Progress Bar (Visual only for now since simple upload) */}
          {isUploading && (
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-in-out"
                style={{ width: `${progress === 0 ? 10 : progress}%` }}
              />
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full bg-white text-black hover:bg-white/90 font-bold rounded-xl h-11"
          >
            {isUploading ? "Uploading in background..." : "Upload Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
