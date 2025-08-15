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
import { useRef } from "react";

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
    let isMounted = true;
    let timer: any;
    const beat = async () => {
      try {
        // Optional: include user id header to skip server getUser call
        let userId: string | null = null;
        try {
          userId = await db.getCurrentUserId();
        } catch {}
        const res = await fetch("/api/cache/heartbeat", {
          method: "GET",
          headers: userId ? { "x-user-id": userId } : undefined,
          cache: "no-store",
        });
        // ignore body, server tracks
      } catch {}
      if (!isMounted) return;
      timer = setTimeout(beat, 45000); // ~45s cadence, TTL default 60s
    };
    beat();

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
      isMounted = false;
      if (timer) clearTimeout(timer);
		};
	}, []);
	
	// Server query already orders pinned first; keep client-side sort for safety
	const sortedChatHistory = useMemo(() => {
		return [...chatHistory].sort((a, b) => {
			const aPinned = Boolean(a.pinned_at);
			const bPinned = Boolean(b.pinned_at);
			if (aPinned !== bPinned) return aPinned ? -1 : 1;
			if (aPinned && bPinned) {
				return new Date(b.pinned_at as string).getTime() - new Date(a.pinned_at as string).getTime();
			}
			return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
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
