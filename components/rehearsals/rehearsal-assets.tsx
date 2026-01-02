"use client";

import { useState } from "react";
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
} from "lucide-react";
import { updateRehearsalMetadataAction } from "@/app/actions/rehearsal-actions";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

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

  function detectType(url: string): Asset["type"] {
    if (
      url.includes("spotify") ||
      url.includes("soundcloud") ||
      url.includes("music")
    )
      return "music";
    if (url.includes("docs.google") || url.includes("pdf")) return "doc";
    if (url.includes("youtube") || url.includes("vimeo")) return "video";
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

  async function handleAdd() {
    if (!newTitle || !newUrl) return;

    // Basic URL validation
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
    toast.success("Link added");
  }

  async function handleDelete(id: string) {
    const updatedAssets = assets.filter((a) => a.id !== id);
    await saveAssets(updatedAssets);
  }

  async function saveAssets(newAssets: Asset[]) {
    setAssets(newAssets);
    const newMetadata = {
      ...metadata,
      assets: newAssets,
    };
    await updateRehearsalMetadataAction(rehearsalId, farewellId, newMetadata);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4">
          Studio Resources
        </h2>
        <div className="space-y-3">
          {assets.map((asset) => (
            <Card
              key={asset.id}
              className="p-4 flex items-center justify-between group hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-muted rounded-full shrink-0">
                  {getIcon(asset.type)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{asset.title}</h3>
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:underline truncate block"
                  >
                    {asset.url}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <a href={asset.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(asset.id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}

          {assets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg bg-muted/10">
              No resources added yet.
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div>
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Add New Resource</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g. Master Track, Script..."
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
              <Button className="w-full" onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" /> Add Resource
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
