"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
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

interface SearchModalProps {
	collapsed?: boolean;
}

export function SearchModal({ collapsed = false }: SearchModalProps){
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<any[]>([]);
	const router = useRouter();
	
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

	// Perform search when query changes (debounced)
	useEffect(() => {
		if (!open) return;

		if (query.trim().length === 0) {
			setResults([]);
			return;
		}

		setLoading(true);
		const handler = setTimeout(async () => {
			try {
				const data = await search.searchMessagesPaginated(query);
				setResults(data || []);
			} catch (err) {
				console.error('Search error:', err);
				setResults([]);
			} finally {
				setLoading(false);
			}
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
						<span className="text-xs">⌘</span>K
					</kbd>
				</Button>
			)}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search chat history..."
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
                  className="flex flex-col items-start"
                >
                  <div className="font-medium">
                    {result.chat_title || "Untitled Chat"}
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {result.highlighted_content || result.content || "No content preview"}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
		</>
	)
}