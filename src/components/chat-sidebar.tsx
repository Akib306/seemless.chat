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

import { Plus } from "lucide-react";
import * as db from "@/lib/db/client";
import { Chat } from "@/types/db";
import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname, RedirectType } from "next/navigation";
import { redirect } from 'next/navigation'
import { ChatSidebarHeader } from "@/components/chat-sidebar-header";
import { ChatItem } from "@/components/chat-item";

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
								<ChatItem
									key={chat.id}
									chat={chat}
									isActive={isActive}
									isRenaming={isRenaming}
									renameValue={renameValue}
									onRenameValueChange={setRenameValue}
									onRenameKeyDown={handleRenameKeyDown}
									onRenameBlur={handleSaveRename}
									onToggleRename={toggleRenameInput}
								/>
							);
						})}
					</SidebarMenu>
				</SidebarContent>
				<SidebarRail />
			</Sidebar>
		</>
	);
}
