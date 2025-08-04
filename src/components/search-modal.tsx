import type React from "react";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
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
						<div className="p-6" onClick={(e) => e.stopPropagation()}>
							<Command.Input 
								placeholder="Search chat history..." 
								className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-100"
							/>

							<Command.Separator className="-mx-6 my-4 h-px bg-border" />

							<Command.List className="max-h-[350px] overflow-y-auto overflow-x-hidden px-3 py-2">
								{loading && <Command.Loading>Hang on…</Command.Loading>}

								<Command.Empty>No results found.</Command.Empty>

								<Command.Group heading="Recent Chats" className="space-y-2">
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