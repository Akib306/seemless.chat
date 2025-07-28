"use client";
import type * as React from "react";
import { SearchForm } from "./search-form";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	SidebarTrigger,
} from "@/components/ui/sidebar";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { EllipsisVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import * as db from "@/lib/db/client";
import { Chat } from "@/types/db";
import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname, RedirectType } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { redirect } from 'next/navigation'
import { ChatSidebarHeader } from "@/components/ChatSidebarHeader";

import { createClient } from "@/lib/supabase/client";
import { Router } from "next/router";

const supabase = createClient();
export function ChatSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const router = useRouter();
	const pathname = usePathname();
	const currentChatId = useMemo(() => {
		const segments = pathname.split("/");
		// pathname starts with "" due to leading slash
		// e.g., "/chat/123" => ["", "chat", "123"]
		if (segments.length >= 3 && segments[1] === "chat") {
			return segments[2] || null;
		}
		return null;
	}, [pathname]);
	const [chatHistory, setChatHistory] = useState<Chat[]>([]);
	const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
	const [renameValue, setRenameValue] = useState<string>("");

	const toggleRenameInput = async (chatId: string) => {
		try {
			const currentTitle = await db.chats.getChatTitle(chatId);
			setRenamingChatId(chatId);
			setRenameValue(currentTitle || "");
		} catch (error) {
			console.error("Failed to get chat title:", error);
		}
	};

	const handleSaveRename = async (chatId: string) => {
		if (!renameValue.trim()) {
			handleCancelRename();
			return;
		}

		try {
			await db.chats.updateChatTitle(chatId, renameValue.trim());
			setRenamingChatId(null);
			setRenameValue("");
			
			// Update local state to reflect the change immediately
			setChatHistory(prev => 
				prev.map(chat => 
					chat.id === chatId 
						? { ...chat, title: renameValue.trim() }
						: chat
				)
			);
		} catch (error) {
			console.error("Failed to update chat title:", error);
		}
	};

	const handleCancelRename = () => {
		setRenamingChatId(null);
		setRenameValue("");
	};

	const handleRenameKeyDown = (e: React.KeyboardEvent, chatId: string) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSaveRename(chatId);
		} else if (e.key === "Escape") {
			handleCancelRename();
		}
	};

	const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
	
		try {
			await db.chats.deleteChat(chatId);
			router.push('/chat');
		} catch (error) {
			console.error("Failed to delete chat:", error);
		}
	};
	useEffect(() => {
		const fetchChatHistory = async () => {
			const userId = await db.getCurrentUserId();
			const chats = await db.chats.getChats(userId);
			setChatHistory(chats);
		};
		fetchChatHistory();

		const channel = supabase
			.channel("realtime:chats")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "chats" },
				(payload) => {
					setChatHistory((prev) => {
						if (payload.eventType === "INSERT") {
							// Check for duplicates before adding
							const exists = prev.some((chat) => chat.id === payload.new.id);
							if (exists) return prev;
							return [payload.new as Chat, ...prev];
						}

						if (payload.eventType === "UPDATE") {
							return prev.map((chat) =>
								chat.id === payload.new.id ? (payload.new as Chat) : chat,
							);
						}

						if (payload.eventType === "DELETE") {
							return prev.filter((chat) => chat.id !== payload.old.id);
						}

						return prev;
					});
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, []);

		
	
	return (
		<>
			

			<Sidebar collapsible="offcanvas" {...props}>
				<SidebarHeader className="pt-16">
					<ChatSidebarHeader />
				</SidebarHeader>

				<SidebarContent>
					<SidebarMenu>
						{chatHistory.map((chat) => {
							const isActive = chat.id === currentChatId;
							const isRenaming = renamingChatId === chat.id;
							
							return (
								<SidebarMenuItem className="px-3 py-0" key={chat.id}>
									<SidebarMenuButton
										asChild
										isActive={isActive}
										className="flex flex-col items-start hover:bg-secondary py-1"
									>
										<Link href={`/chat/${chat.id}`} className="w-full">
											<div
												className={cn(
													"w-full flex justify-between items-start",
													isActive && "text-green-500",
												)}
											>
												{isRenaming ? (
													<Input
														value={renameValue}
														onChange={(e) => setRenameValue(e.target.value)}
														onKeyDown={(e) => handleRenameKeyDown(e, chat.id)}
														onBlur={() => handleSaveRename(chat.id)}
														className="flex-1 text-base h-auto p-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
														autoFocus
														onClick={(e) => e.preventDefault()}
													/>
												) : (
													<div className="flex-1 text-base">
														{chat.title}
													</div>
												)}

												<DropdownMenu>
													<DropdownMenuTrigger
														className="md:opacity-0 group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100"
													>
														<EllipsisVertical className="h-5 w-5" />
													</DropdownMenuTrigger>
													<DropdownMenuContent
														side="right"
														align="start"
														sideOffset={20}
													>
														<DropdownMenuItem>Pin</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => toggleRenameInput(chat.id)}
														>
															Rename
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={(e) => handleDeleteChat(chat.id, e)}
														>
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarContent>
				<SidebarRail />
			</Sidebar>
		</>
	);
}
