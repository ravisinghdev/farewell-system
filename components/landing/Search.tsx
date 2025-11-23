"use client";
import React, { useState, useEffect, useRef, JSX } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

type SearchItem = {
  id: string;
  type: string;
  title: string;
  desc: string;
};

export default function Search(): JSX.Element {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setOpen(false);
      return;
    }

    // Debounce network calls
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) {
          setResults([]);
          setOpen(false);
          return;
        }
        const data: SearchItem[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
        setOpen(false);
      }
    }, 200);

    return () => window.clearTimeout(timerRef.current);
  }, [query]);

  function goTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search features, sections, FAQs..."
            aria-label="Search site"
            className="w-full"
          />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-md p-0">
          <div className="p-2">
            {results.length === 0 ? (
              <div className="p-2 text-sm text-slate-500">No results</div>
            ) : (
              results.map((r) => (
                <div
                  key={r.id}
                  className="p-2 rounded-md hover:bg-slate-50 cursor-pointer"
                  onClick={() => goTo(r.id)}
                >
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-slate-500">{r.desc}</div>
                </div>
              ))
            )}
          </div>
          <div className="border-t p-2 text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
