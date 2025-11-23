// components/landing/SearchDropdown.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { useSearch } from "./SearchProvider";
import { motion } from "framer-motion";

export default function SearchDropdown() {
  const { matches, query, focusedMatchIndex, setFocusedMatchIndex, setQuery } =
    useSearch();
  const boxRef = useRef<HTMLDivElement | null>(null);

  const show = (query ?? "").toString().trim().length > 0;

  useEffect(() => {
    if (focusedMatchIndex === null) return;
    const node = boxRef.current?.querySelectorAll("[data-search-item]")[
      focusedMatchIndex
    ] as HTMLElement | undefined;
    if (node) node.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusedMatchIndex]);

  const onSelect = (itemId: string) => {
    const it = matches.find((m) => m.id === itemId);
    if (it?.ref?.current) {
      try {
        it.ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
        it.ref.current.focus?.();
      } catch {
        // ignore
      }
    }
    setQuery("");
    setFocusedMatchIndex(null);
  };

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute left-0 right-0 mt-2 z-50"
      ref={boxRef}
    >
      <div className="max-h-64 overflow-auto border rounded-md shadow bg-popover p-2">
        {matches.length === 0 ? (
          <div className="py-3 px-4 text-sm text-muted-foreground">
            No results
          </div>
        ) : (
          matches.map((m, i) => (
            <div
              key={m.id}
              data-search-item
              tabIndex={0}
              onClick={() => onSelect(m.id)}
              onMouseEnter={() => setFocusedMatchIndex(i)}
              className={`cursor-pointer px-3 py-2 rounded-md mb-1 ${
                focusedMatchIndex === i ? "bg-accent/30" : "hover:bg-accent/10"
              }`}
            >
              <div className="text-sm font-medium">{m.title}</div>
              {m.description && (
                <div className="text-xs text-muted-foreground">
                  {m.description}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
