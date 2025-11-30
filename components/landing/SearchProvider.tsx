// components/landing/SearchProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";

export type SearchItem = {
  id: string;
  title: string;
  description?: string;
  type?: "hero" | "feature" | "highlight" | "other";
  ref?: React.RefObject<HTMLElement | null>;
};

type SearchContextValue = {
  register: (item: SearchItem) => void;
  unregister: (id: string) => void;
  items: SearchItem[];
  query: string;
  setQuery: (q: string) => void;
  matches: SearchItem[];
  focusedMatchIndex: number | null;
  setFocusedMatchIndex: React.Dispatch<React.SetStateAction<number | null>>;
  clear: () => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used inside SearchProvider");
  return ctx;
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const itemsRef = useRef<Map<string, SearchItem>>(new Map());
  const [query, setQuery] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [focusedMatchIndex, setFocusedMatchIndex] = useState<number | null>(
    null
  );
  // small version state to force recompute when registry changes
  const [, setVersion] = useState(0);

  const register = useCallback((item: SearchItem) => {
    itemsRef.current.set(item.id, item);
    setVersion((v) => v + 1);
  }, []);

  const unregister = useCallback((id: string) => {
    itemsRef.current.delete(id);
    setVersion((v) => v + 1);
  }, []);

  const items = useMemo(
    () => Array.from(itemsRef.current.values()),
    [itemsRef.current, query] /* eslint-disable-line */
  );

  const qLower = (query ?? "").toString().trim().toLowerCase();

  const matches = useMemo(() => {
    if (!qLower) return items;
    return items.filter((it) => {
      const title = it.title?.toLowerCase() ?? "";
      const desc = it.description?.toLowerCase() ?? "";
      return title.includes(qLower) || desc.includes(qLower);
    });
  }, [items, qLower]);

  const clear = useCallback(() => {
    setQuery("");
    setFocusedMatchIndex(null);
  }, []);

  useEffect(() => {
    if (!qLower) setFocusedMatchIndex(null);
  }, [qLower]);

  const value = useMemo(
    () => ({
      register,
      unregister,
      items,
      query,
      setQuery,
      matches,
      focusedMatchIndex,
      setFocusedMatchIndex,
      clear,
      isSearchOpen,
      setIsSearchOpen,
    }),
    [
      register,
      unregister,
      items,
      query,
      setQuery,
      matches,
      focusedMatchIndex,
      setFocusedMatchIndex,
      clear,
      isSearchOpen,
      setIsSearchOpen,
    ]
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}
