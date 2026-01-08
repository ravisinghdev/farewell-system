"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createHighlightAction } from "@/app/actions/dashboard-actions";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

import { Loader2, Plus, Image as ImageIcon } from "lucide-react";

interface CreateHighlightDialogProps {
  farewellId: string;
}

import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";

export function CreateHighlightDialog({
  farewellId,
}: CreateHighlightDialogProps) {
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell.role);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [link, setLink] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  if (!isAdmin) return null;

  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [originalImageSrc, setOriginalImageSrc] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setOriginalImageSrc(objectUrl);
      setIsCropping(true);
      // Reset crop state
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    try {
      const croppedBlob = await getCroppedImg(
        originalImageSrc,
        croppedAreaPixels,
        rotation
      );
      if (croppedBlob) {
        const croppedFile = new File([croppedBlob], "cropped-image.jpg", {
          type: "image/jpeg",
        });
        setImageFile(croppedFile);
        setPreviewUrl(URL.createObjectURL(croppedFile));
        setIsCropping(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to crop image");
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setOriginalImageSrc("");
    setImageFile(null);
    setPreviewUrl("");
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsUploading(true);
    let finalImageUrl = "";

    try {
      if (imageFile) {
        const supabase = createClient();
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${farewellId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("highlights")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("highlights").getPublicUrl(fileName);

        finalImageUrl = publicUrl;
      }

      startTransition(async () => {
        const res = await createHighlightAction(
          farewellId,
          title,
          description,
          finalImageUrl,
          link
        );

        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Highlight added successfully!");
          router.refresh(); // Refresh server components to show new data
          setOpen(false);
          setTitle("");
          setDescription("");
          setImageFile(null);
          setPreviewUrl("");
          setLink("");
          setOriginalImageSrc("");
        }
      });
    } catch (error: any) {
      toast.error("Failed to upload image: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Highlight
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Highlight</DialogTitle>
          <DialogDescription>
            Feature a memory, update, or important link.
          </DialogDescription>
        </DialogHeader>

        {isCropping ? (
          <div className="space-y-4">
            <div className="relative h-[300px] w-full bg-black rounded-md overflow-hidden">
              <Cropper
                image={originalImageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={4 / 3}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="w-16">Zoom</Label>
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={(v) => setZoom(v[0])}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-16">Rotate</Label>
                <Slider
                  value={[rotation]}
                  min={0}
                  max={360}
                  step={1}
                  onValueChange={(v) => setRotation(v[0])}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCropCancel}>
                Cancel
              </Button>
              <Button onClick={handleCropSave}>Save Crop</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Prom Night Photos"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">Image (Optional)</Label>
              <div className="flex flex-col gap-2">
                {!previewUrl && (
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                )}
                {previewUrl && (
                  <div className="h-40 w-full rounded-md border overflow-hidden relative bg-muted group">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setIsCropping(true);
                          // If originalImageSrc is not set (e.g., if image was loaded from DB),
                          // we might need to set it from previewUrl to allow re-cropping.
                          // For now, assuming originalImageSrc is available if previewUrl is.
                          if (!originalImageSrc && previewUrl) {
                            setOriginalImageSrc(previewUrl);
                          }
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setImageFile(null);
                          setPreviewUrl("");
                          setOriginalImageSrc("");
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="link">External Link (Optional)</Label>
              <Input
                id="link"
                placeholder="https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief details..."
                className="h-20"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        )}

        {!isCropping && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || isUploading || !title.trim()}
            >
              {(isPending || isUploading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isUploading ? "Uploading..." : "Add Highlight"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
