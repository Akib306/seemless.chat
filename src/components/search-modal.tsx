import type React from "react";
import { useState } from "react";
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
	
	return (
		<>
			<Button 
				variant="ghost" 
				onClick={() => setOpen(true)} 
				className="w-full button-hover-enhanced focus-enhanced"
			>
				<Search className="w-4 h-4 mr-2" />
				<span className="text-hierarchy-primary">Search Chats</span>
			</Button>
			<Command.Dialog 
				open={open} 
				onOpenChange={setOpen}
				className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-background/80"
			>
				<div className="w-full max-w-2xl card-elevated rounded-lg p-6 m-4">
					<div className="mb-4">
						<h2 className="text-lg font-semibold text-hierarchy-primary mb-2">
							Search Chat History
						</h2>
						<p className="text-sm text-hierarchy-tertiary">
							Find conversations, messages, and topics from your chat history
						</p>
					</div>
					
					<Command.Input 
						placeholder="Type to search conversations..." 
						className="input-enhanced h-12 w-full rounded-lg px-4 py-3 text-sm focus-enhanced mb-4"
					/>

					<Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden rounded-md border border-border">
						{loading && (
							<Command.Loading className="py-6 text-center text-hierarchy-secondary">
								<div className="flex items-center justify-center space-x-2">
									<div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
									<span>Searching...</span>
								</div>
							</Command.Loading>
						)}

						<Command.Empty className="py-8 text-center text-hierarchy-tertiary">
							<div className="flex flex-col items-center space-y-2">
								<Search className="h-8 w-8 opacity-50" />
								<p>No conversations found</p>
								<p className="text-xs">Try different search terms</p>
							</div>
						</Command.Empty>

						<Command.Group heading="Recent Conversations" className="p-2">
							<Command.Item className="sidebar-item-hover rounded-md px-3 py-2 cursor-pointer">
								<div className="flex flex-col">
									<span className="text-hierarchy-primary font-medium">React Best Practices</span>
									<span className="text-hierarchy-tertiary text-xs">2 hours ago</span>
								</div>
							</Command.Item>
							<Command.Item className="sidebar-item-hover rounded-md px-3 py-2 cursor-pointer">
								<div className="flex flex-col">
									<span className="text-hierarchy-primary font-medium">TypeScript Debugging</span>
									<span className="text-hierarchy-tertiary text-xs">Yesterday</span>
								</div>
							</Command.Item>
							<Command.Separator className="my-1 border-border" />
							<Command.Item className="sidebar-item-hover rounded-md px-3 py-2 cursor-pointer">
								<div className="flex flex-col">
									<span className="text-hierarchy-primary font-medium">API Integration Help</span>
									<span className="text-hierarchy-tertiary text-xs">3 days ago</span>
								</div>
							</Command.Item>
						</Command.Group>

						<Command.Group heading="Suggestions" className="p-2">
							<Command.Item className="sidebar-item-hover rounded-md px-3 py-2 cursor-pointer">
								<span className="text-hierarchy-secondary">Search by topic or keyword</span>
							</Command.Item>
						</Command.Group>
					</Command.List>

					<div className="mt-4 pt-4 border-t border-border">
						<div className="flex justify-between items-center text-xs text-hierarchy-tertiary">
							<span>Use ↑↓ arrows to navigate</span>
							<span>Press Enter to open</span>
						</div>
					</div>
				</div>
			</Command.Dialog>
		</>
	)
}