"use client";
import type * as React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarMenu,
	SidebarRail,
} from "@/components/ui/sidebar";

import * as db from "@/lib/db/client";
import { Chat } from "@/types/db";
import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChatSidebarHeader } from "@/components/chat-sidebar-header";
import { ChatItem } from "@/components/chat-item";
import { createClient } from "@/lib/supabase/client";

// Extended Chat type to include pinned_at until types are regenerated
type ChatWithPin = Chat & { pinned_at?: string | null };

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
	const [chatHistory, setChatHistory] = useState<ChatWithPin[]>([]);

	useEffect(() => {
		const fetchChatHistory = async () => {
			const userId = await db.getCurrentUserId();
			const chats = await db.chats.getChats(userId);
			setChatHistory(chats as ChatWithPin[]);
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
							return [payload.new as ChatWithPin, ...prev];
						}

						if (payload.eventType === "UPDATE") {
							return prev.map((chat) =>
								chat.id === payload.new.id ? (payload.new as ChatWithPin) : chat,
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
	
	// Sort chats: pinned chats first (by pinned_at desc), then unpinned chats (by updated_at desc)
	const sortedChatHistory = useMemo(() => {
		return [...chatHistory].sort((a, b) => {
			// If both are pinned or both are unpinned
			if ((a.pinned_at && b.pinned_at) || (!a.pinned_at && !b.pinned_at)) {
				if (a.pinned_at && b.pinned_at) {
					// Both pinned: sort by pinned_at (most recently pinned first)
					return new Date(b.pinned_at).getTime() - new Date(a.pinned_at).getTime();
				} else {
					// Both unpinned: sort by updated_at (most recently updated first)
					return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
				}
			}
			// One is pinned, one is not: pinned chat comes first
			return a.pinned_at ? -1 : 1;
		});
	}, [chatHistory]);
	
	return (
		<>
			<Sidebar collapsible="icon" {...props}>
				<SidebarHeader className="pt-16">
					<ChatSidebarHeader />
				</SidebarHeader>

				<SidebarContent>
					<SidebarMenu className="group-data-[collapsible=icon]:hidden">
						
						{sortedChatHistory.map((chat) => {
							const isActive = chat.id === currentChatId;
							
							return (
								<ChatItem
									key={chat.id}
									chat={chat}
									isActive={isActive}
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
