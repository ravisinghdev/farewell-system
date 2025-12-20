"use client";

import { motion } from "framer-motion";
import {
  Download,
  Music2,
  FileText,
  Play,
  Pause,
  Trash2,
  MoreVertical,
  File,
  FileImage,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { checkIsAdmin } from "@/lib/auth/roles";
import { useFarewell } from "@/components/providers/farewell-provider";

export interface ResourceItem {
  id: string;
  type: "template" | "music" | "download";
  title: string;
  description?: string;
  file_url: string;
  metadata?: any;
  created_at: string;
  member?: {
    user?: {
      full_name: string;
      avatar_url: string;
    };
  };
}

interface ResourceCardProps {
  item: ResourceItem;
  onDelete: (id: string) => void;
  onPlay?: (url: string) => void;
  isPlaying?: boolean;
}

export function ResourceCard({
  item,
  onDelete,
  onPlay,
  isPlaying,
}: ResourceCardProps) {
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell?.role);
  const [isHovered, setIsHovered] = useState(false);

  // Icon based on type
  const TypeIcon = () => {
    switch (item.type) {
      case "template":
        return <FileImage className="h-5 w-5" />;
      case "music":
        return <Music2 className="h-5 w-5" />;
      case "download":
        return <FileText className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative bg-card rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Visual Header */}
      <div
        className={cn(
          "relative h-48 w-full overflow-hidden flex items-center justify-center",
          item.type === "template"
            ? "bg-muted"
            : "bg-gradient-to-br from-primary/5 to-primary/10"
        )}
      >
        {item.type === "template" &&
          (item.file_url.match(/\.(jpeg|jpg|gif|png)$/) ? (
            <img
              src={item.file_url}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <FileImage className="h-12 w-12 text-muted-foreground/50" />
            </div>
          ))}

        {item.type === "music" && (
          <div className="flex flex-col items-center gap-4 z-10">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-inner">
              <Music2 className="h-8 w-8 text-primary" />
            </div>
            {/* Fake Visualizer */}
            <div className="flex items-end gap-1 h-8">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: isPlaying ? [10, 32, 10] : 10 }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.8,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                  className="w-1.5 bg-primary rounded-full opacity-60"
                />
              ))}
            </div>
          </div>
        )}

        {item.type === "download" && (
          <div className="flex flex-col items-center justify-center p-6 bg-blue-50/50 dark:bg-blue-900/10 w-full h-full">
            <FileText className="h-16 w-16 text-blue-500 drop-shadow-lg" />
            <p className="mt-2 text-xs font-mono text-blue-500/70">
              {item.metadata?.size || "FILE"}
            </p>
          </div>
        )}

        {/* Hover Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3",
            isPlaying && "opacity-100"
          )}
        >
          {item.type === "music" ? (
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full w-12 h-12 shadow-lg"
              onClick={() => onPlay?.(item.file_url)}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-1" />
              )}
            </Button>
          ) : (
            <Button size="sm" variant="secondary" className="shadow-lg" asChild>
              <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" /> Download
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1 w-full overflow-hidden">
            <h3 className="font-semibold text-base truncate" title={item.title}>
              {item.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 h-8">
              {item.description || "No description provided."}
            </p>
          </div>

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Footer: User Info & Meta */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={item.member?.user?.avatar_url} />
              <AvatarFallback className="text-[10px]">
                {item.member?.user?.full_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
              {item.member?.user?.full_name || "Admin"}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground/70 font-medium px-2 py-1 bg-secondary rounded-full">
            {item.type.toUpperCase()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
