"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { getGiftsAction } from "@/app/actions/legacy-actions";

export function GiftsList({
  initialGifts,
  farewellId,
}: {
  initialGifts: any[];
  farewellId: string;
}) {
  const [gifts, setGifts] = useState(initialGifts);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setGifts(initialGifts);
  }, [initialGifts]);

  useEffect(() => {
    const channel = supabase
      .channel("legacy_gifts_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "legacy_gifts",
          filter: `farewell_id=eq.${farewellId}`,
        },
        async () => {
          const newData = await getGiftsAction(farewellId);
          setGifts(newData);
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, farewellId, router]);

  if (gifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <Gift className="h-12 w-12 mb-4 opacity-20" />
        <p>No gifts sent yet. Be the first to send one!</p>
      </div>
    );
  }

  const getGiftColor = (type: string) => {
    switch (type) {
      case "flower":
        return "from-pink-500/10 to-purple-500/10 border-pink-200/20";
      case "trophy":
        return "from-yellow-500/10 to-orange-500/10 border-yellow-200/20";
      case "star":
        return "from-blue-500/10 to-cyan-500/10 border-blue-200/20";
      default:
        return "from-green-500/10 to-emerald-500/10 border-green-200/20";
    }
  };

  const getGiftIcon = (type: string) => {
    switch (type) {
      case "flower":
        return "🌸";
      case "trophy":
        return "🏆";
      case "star":
        return "⭐";
      default:
        return "🎁";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {gifts.map((gift) => (
        <div
          key={gift.id}
          className={`p-6 rounded-xl border bg-gradient-to-br ${getGiftColor(
            gift.gift_type
          )} shadow-sm hover:shadow-md transition-shadow`}
        >
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center text-2xl">
              {getGiftIcon(gift.gift_type)}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(gift.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
          <p className="mt-4 font-medium">"{gift.message}"</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            {gift.sender_id?.avatar_url ? (
              <img
                src={gift.sender_id.avatar_url}
                alt={gift.sender_id.full_name}
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px]">
                {gift.sender_id?.full_name?.[0] || "?"}
              </div>
            )}
            <span>From: {gift.sender_id?.full_name || "Anonymous"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
