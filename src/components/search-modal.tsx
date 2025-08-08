"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { Search, Clock } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { Button } from "./ui/button";
import { search } from "@/lib/db/client";
import { useRouter } from "next/navigation";

// Simple in-memory LRU cache with TTL for search results
type SearchCacheEntry = { results: any[]; timestamp: number };
const SEARCH_CACHE: Map<string, SearchCacheEntry> = new Map();
const CACHE_TTL_MS = 60_000; // 1 minute
const MAX_CACHE_ENTRIES = 50;

function normalizeQuery(value: string): string {
  return value.trim();
}

function getCache(key: string): SearchCacheEntry | undefined {
  const entry = SEARCH_CACHE.get(key);
  if (!entry) return undefined;
  return entry;
}

function isFresh(entry: SearchCacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

function setCache(key: string, results: any[]) {
  // Move to end to mark as most recently used
  if (SEARCH_CACHE.has(key)) {
    SEARCH_CACHE.delete(key);
  }
  SEARCH_CACHE.set(key, { results, timestamp: Date.now() });
  // Evict least-recently used
  if (SEARCH_CACHE.size > MAX_CACHE_ENTRIES) {
    const firstKey = SEARCH_CACHE.keys().next().value as string | undefined;
    if (firstKey) SEARCH_CACHE.delete(firstKey);
  }
}

interface SearchModalProps {
    collapsed?: boolean;
}

export function SearchModal({ collapsed = false }: SearchModalProps){
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<any[]>([]);
    const router = useRouter();

    function formatRelative(dateString?: string): string {
      if (!dateString) return "";
      const date = new Date(dateString);
      const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      if (seconds < 60) return "just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 30) return `${days}d ago`;
      return date.toLocaleDateString();
    }
	
	// Handle keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Handle Cmd+K (Mac) or Ctrl+K (Windows/Linux) to toggle search
			if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				setOpen(prev => !prev);
				return;
			}
			
			// Handle Escape key to close modal
			if (event.key === 'Escape' && open) {
				setOpen(false);
			}
		};

		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [open]);

    // Perform search when query changes (debounced) with cache and SWR-like behavior
    useEffect(() => {
        if (!open) return;

        const normalized = normalizeQuery(query);
        if (normalized.length === 0) {
            setResults([]);
            setLoading(false);
            return;
        }

        const cached = getCache(normalized);
        const hasCache = Boolean(cached);
        const cacheIsFresh = cached ? isFresh(cached) : false;

        if (hasCache) {
            setResults(cached!.results);
            setLoading(!cacheIsFresh); // only show loading if we'll revalidate
        } else {
            setLoading(true);
        }

        const handler = setTimeout(async () => {
            // Skip network if cache is fresh
            if (cacheIsFresh) return;

            let cancelled = false;
            try {
                const data = await search.searchMessagesPaginated(normalized);
                if (cancelled) return;
                setCache(normalized, data || []);
                setResults(data || []);
            } catch (err) {
                console.error('Search error:', err);
                if (!hasCache) setResults([]);
            } finally {
                if (!cacheIsFresh) setLoading(false);
            }

            return () => {
                cancelled = true;
            };
        }, 400);

        return () => clearTimeout(handler);
    }, [query, open]);

	const handleSelect = (chatId: string, messageId: string) => {
		setOpen(false);
		router.push(`/chat/${chatId}`);
	};

	return (
		<>
			{collapsed ? (
				<Button
					variant="ghost"
					size="icon"
					className="h-10 w-10"
					onClick={() => setOpen(true)}
				>
					<Search className="h-5 w-5" />
				</Button>
			) : (
				<Button variant="ghost" onClick={() => setOpen(true)} className="w-full justify-between text-base">
					<div className="flex items-center">
						<Search className="w-4 h-4 mr-2" />
						Search Chats
					</div>
					
					<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5">
						<span className="text-base">⌘+K</span>
					</kbd>
				</Button>
			)}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search chats..."
          value={query}
          onValueChange={(val: string) => setQuery(val)}
        />
        <CommandList>
          <CommandEmpty>
            {loading
              ? "Searching…"
              : query.trim().length === 0
              ? "Start typing to search…"
              : "No results found."}
          </CommandEmpty>
          {results.length > 0 && (
            <CommandGroup heading={`${results.length} Results`}>
              {results.map((result) => (
                <CommandItem
                  key={result.message_id}
                  value={`${result.chat_title || "Untitled"} ${result.content || ""} ${result.message_id}`}
                  onSelect={() => handleSelect(result.chat_id, result.message_id)}
                  className="flex flex-col items-start gap-1"
                >
                  <div className="flex w-full items-center gap-2">
                    <div className="font-medium truncate flex-1">
                      {result.chat_title || "Untitled Chat"}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-foreground/60">
                      <Clock className="h-3 w-3 text-foreground/60" />
                      <span>{formatRelative(result.created_at)}</span>
                    </div>
                  </div>
                  <div
                    className="text-sm text-foreground/70 line-clamp-2 [&_b]:text-inherit [&_b]:font-medium"
                    dangerouslySetInnerHTML={{
                      __html: result.highlighted_content ||
                        (result.content ? (result.content as string) : "")
                    }}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {/* Sticky helper footer */}
      
        </CommandList>
      </CommandDialog>
		</>
	)
}