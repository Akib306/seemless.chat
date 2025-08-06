"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Command } from "cmdk";
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
			{open && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center"
					onClick={() => setOpen(false)}
				>
					<Command className="w-full max-w-2xl bg-card border rounded-lg shadow-lg overflow-hidden">
						<div className="p-4" onClick={(e) => e.stopPropagation()}>
							<div className="flex flex-row items-center">
								<Search className="w-4 h-4 mr-2" />
								<Command.Input 
									placeholder="Search chat history..."
									autoFocus
									value={query}
									onValueChange={(val: string) => setQuery(val)}
									className="flex h-10 w-full border-none bg-card text-base placeholder:text-muted-foreground focus-visible:outline-none "
								/>
								<X className="w-5 h-5 ml-2" onClick={() => setOpen(false)} />
							</div>
							

							<Command.Separator className="-mx-6 my-4 h-px bg-border" />

							<Command.List className="max-h-[350px] overflow-y-auto overflow-x-hidden px-3 py-2">
								{loading && <Command.Loading>Hang on…</Command.Loading>}
								{!loading && results.length === 0 && (
									<Command.Empty>No results found.</Command.Empty>
								)}

								{results.length > 0 && (
									<Command.Group heading={`${results.length} Results`} className="space-y-2 text-base">
										{results.map((result) => (
											<Command.Item 
												key={result.message_id} 
												value={result.chat_title || 'Untitled'} 
												onSelect={() => handleSelect(result.chat_id, result.message_id)}
												className="flex flex-col items-start p-3 rounded hover:bg-muted cursor-pointer"
											>
												<div className="font-medium">{result.chat_title || 'Untitled Chat'}</div>
												<div className="text-sm text-muted-foreground line-clamp-2 mt-1">
													{result.highlighted_content || result.content || 'No content preview'}
												</div>
											</Command.Item>
										))}
									</Command.Group>
								)}

							</Command.List>
						</div>
					</Command>
				</div>
			)}
		</>
	)
}