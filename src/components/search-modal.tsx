import type React from "react";
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Command, CommandInput } from "cmdk";

import { Label } from "@/components/ui/label";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarInput,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";


export function SearchModal(){
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	
	// Handle Escape key to close modal
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setOpen(false);
			}
		};

		if (open) {
			document.addEventListener('keydown', handleKeyDown);
		}

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [open]);
	
	return (
		<>
			<Button variant="ghost" onClick={() => setOpen(true)} className="w-full">
				<Search className="w-4 h-4 mr-2" />
				Search Chats
			</Button>
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
									className="flex h-10 w-full border-none bg-card text-base placeholder:text-muted-foreground focus-visible:outline-none "
								/>
								<X className="w-5 h-5 ml-2" onClick={() => setOpen(false)} />
							</div>
							

							<Command.Separator className="-mx-6 my-4 h-px bg-border" />

							<Command.List className="max-h-[350px] overflow-y-auto overflow-x-hidden px-3 py-2">
								{loading && <Command.Loading>Hang on…</Command.Loading>}

								<Command.Empty>No results found.</Command.Empty>

								<Command.Group heading="Recent Chats" className="space-y-2 text-base">
									<Command.Item>Apple</Command.Item>
									<Command.Item>Orange</Command.Item>
									<Command.Item>Pear</Command.Item>
									<Command.Item>Blueberry</Command.Item>
									<Command.Item>Apple</Command.Item>
									<Command.Item>Orange</Command.Item>
									<Command.Item>Pear</Command.Item>
									<Command.Item>Blueberry</Command.Item>
									<Command.Item>Apple</Command.Item>
									<Command.Item>Orange</Command.Item>
									<Command.Item>Pear</Command.Item>
									<Command.Item>Blueberry</Command.Item>
									<Command.Item>Apple</Command.Item>
									<Command.Item>Orange</Command.Item>
								</Command.Group>
							</Command.List>
						</div>
					</Command>
				</div>
			)}
		</>
	)
}