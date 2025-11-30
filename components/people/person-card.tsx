"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Database } from "@/types/supabase";
import { User } from "lucide-react";

type FarewellMember =
  Database["public"]["Tables"]["farewell_members"]["Row"] & {
    user: Database["public"]["Tables"]["users"]["Row"] | null;
  };

interface PersonCardProps {
  member: FarewellMember;
}

export function PersonCard({ member }: PersonCardProps) {
  const user = member.user;

  if (!user) return null;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-0">
        <div className="aspect-square w-full bg-muted/20 relative group">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name || "User"}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary/50">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <Badge variant="secondary" className="capitalize">
              {member.role}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg truncate">
          {user.full_name || "Unknown User"}
        </h3>
        <p className="text-sm text-muted-foreground truncate">
          {user.email || ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {member.grade && (
            <Badge variant="outline" className="text-xs">
              Class {member.grade}
            </Badge>
          )}
          {member.section && (
            <Badge variant="outline" className="text-xs">
              Sec {member.section}
            </Badge>
          )}
        </div>
        {user.status && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={`h-2 w-2 rounded-full ${
                user.status === "online"
                  ? "bg-green-500"
                  : user.status === "away"
                  ? "bg-yellow-500"
                  : "bg-gray-500"
              }`}
            />
            <span className="capitalize">{user.status}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
