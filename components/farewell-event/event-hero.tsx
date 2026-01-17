"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  format,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
} from "date-fns";
import { Calendar, Clock, MapPin, Sparkles, Share2, Info } from "lucide-react";
import { motion } from "framer-motion";

interface EventHeroProps {
  farewellName: string;
  eventDate?: Date | null;
  venue?: string;
  isEventPast: boolean;
  isAdmin?: boolean;
  onEdit?: () => void;
}

export function EventHero({
  farewellName,
  eventDate,
  venue,
  isEventPast,
  isAdmin,
  onEdit,
}: EventHeroProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!eventDate || isEventPast) return;

    const interval = setInterval(() => {
      const now = new Date();
      if (now >= eventDate) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: differenceInDays(eventDate, now),
        hours: differenceInHours(eventDate, now) % 24,
        minutes: differenceInMinutes(eventDate, now) % 60,
        seconds: differenceInSeconds(eventDate, now) % 60,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [eventDate, isEventPast]);

  if (!mounted) {
    return <Skeleton className="w-full h-[300px] rounded-2xl" />;
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl isolate">
      {/* Dynamic Background with Grain & Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950 z-0" />
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay z-0" />

      {/* Decorative Orbs */}
      <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] rounded-full bg-purple-600/30 blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] rounded-full bg-blue-600/30 blur-[100px] animate-pulse delay-1000" />

      <div className="relative z-10 p-6 md:p-10 lg:p-12 text-white flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
        {/* Left Side: Info */}
        <div className="space-y-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 mb-3 pl-1 pr-3 py-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 mr-2" />
              Main Event
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
              {farewellName}
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap gap-4 text-sm md:text-base font-medium text-white/80"
          >
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
              <Calendar className="w-4 h-4 text-purple-300" />
              {eventDate
                ? format(eventDate, "EEEE, MMMM do, yyyy")
                : "Date TBA"}
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
              <Clock className="w-4 h-4 text-blue-300" />
              {eventDate ? format(eventDate, "h:mm a") : "Time TBA"}
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
              <MapPin className="w-4 h-4 text-pink-300" />
              {venue || "Venue TBA"}
            </div>
          </motion.div>

          {isAdmin && onEdit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={onEdit}
                variant="ghost"
                size="sm"
                className="text-white/50 hover:text-white hover:bg-white/10 -ml-2"
              >
                <Info className="w-4 h-4 mr-2" />
                Edit Event Details
              </Button>
            </motion.div>
          )}
        </div>

        {/* Right Side: Countdown */}
        {eventDate && !isEventPast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full md:w-auto"
          >
            <div className="grid grid-cols-4 gap-2 md:gap-4">
              <CountdownBox label="Days" value={timeLeft.days} />
              <CountdownBox label="Hours" value={timeLeft.hours} />
              <CountdownBox label="Mins" value={timeLeft.minutes} />
              <CountdownBox label="Secs" value={timeLeft.seconds} />
            </div>
          </motion.div>
        )}

        {isEventPast && (
          <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-100 px-6 py-4 rounded-xl">
            <h3 className="text-xl font-bold flex items-center gap-2">
              Event Concluded
            </h3>
            <p className="text-sm opacity-80">Hope it was memorable!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CountdownBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-3 md:p-4 min-w-[70px] md:min-w-[90px]">
      <span className="text-2xl md:text-4xl font-bold tabular-nums tracking-tighter">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-[10px] md:text-xs uppercase tracking-wider text-white/50 font-medium">
        {label}
      </span>
    </div>
  );
}
