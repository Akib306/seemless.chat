"use client";
import type * as React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarMenu,
	SidebarFooter,
	SidebarRail,
} from "@/components/ui/sidebar";

import * as db from "@/lib/db/client";
import { Chat } from "@/types/db";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChatSidebarHeader } from "@/components/chat-sidebar-header";
import { ChatItem } from "@/components/chat-item";
import { createClient } from "@/lib/supabase/client";
import { useRef } from "react";
import type { Profile } from "@/types/db";
import { ChatSidebarFooter } from "@/components/chat-sidebar-footer";

// Extended Chat type to include pinned_at until types are regenerated
type ChatWithPin = Chat & { pinned_at?: string | null };

const supabase = createClient();

/**
 * Extract chatId from a pathname like /chat/abc123
 */
function extractChatIdFromPath(path: string): string | null {
	const segments = path.split("/");
	if (segments.length >= 3 && segments[1] === "chat") {
		return segments[2] || null;
	}
	return null;
}

export function ChatSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	const router = useRouter();
	const nextPathname = usePathname();
	
	// Track current path from both Next.js router and manual popstate events
	const [currentPath, setCurrentPath] = useState(nextPathname);
	
	// Update path when Next.js router changes (e.g., full page navigation)
	useEffect(() => {
		setCurrentPath(nextPathname);
	}, [nextPathname]);
	
	// Listen for popstate events (from client-side navigation)
	useEffect(() => {
		const handlePopState = () => {
			setCurrentPath(window.location.pathname);
		};
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, []);
	
	const currentChatId = useMemo(() => {
		return extractChatIdFromPath(currentPath);
	}, [currentPath]);
	const [chatHistory, setChatHistory] = useState<ChatWithPin[]>([]);
	const [profile, setProfile] = useState<Profile | null>(null);
	const [userEmail, setUserEmail] = useState<string | null>(null);

	const displayName = profile?.username ?? userEmail ?? "User";

	const handleLogout = async () => {
		await supabase.auth.signOut();
		router.push("/auth/login");
	};

	useEffect(() => {
		let isMounted = true;
		let timer: any;
		let channel: ReturnType<typeof supabase.channel> | null = null;
		let changesChannel: ReturnType<typeof supabase.channel> | null = null;

		const beat = async () => {
			try {
				// Optional: include user id header to skip server getUser call
				let userId: string | null = null;
				try {
					userId = await db.getCurrentUserId();
				} catch {}
				await fetch("/api/cache/heartbeat", {
					method: "GET",
					headers: userId ? { "x-user-id": userId } : undefined,
					cache: "no-store",
				});
			} catch {}
			if (!isMounted) return;
			timer = setTimeout(beat, 45000); // ~45s cadence, TTL default 60s
		};
		beat();

		const init = async () => {
			const userId = await db.getCurrentUserId();
			const chats = await db.chats.getChats(userId);
			if (!isMounted) return;
			setChatHistory(chats as ChatWithPin[]);

			// Load profile and auth email
			try {
				const p = await db.profiles.getProfile(userId);
				if (isMounted) setProfile(p);
			} catch {}
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (isMounted) setUserEmail(user?.email ?? null);

			// Ensure Realtime Authorization (if available)
			try {
				const {
					data: { session },
				} = await supabase.auth.getSession();
				if (session?.access_token) {
					// @ts-ignore types for setAuth may vary across versions
					await supabase.realtime.setAuth(session.access_token);
				}
			} catch {}

			// Subscribe to per-user chats broadcast topic
			const topic = `chats:user:${userId}`;
			channel = supabase.channel(topic, {
				config: { broadcast: { ack: true, self: true } },
			});

			const handleBroadcast = (payload: any, expectedEvent: "INSERT" | "UPDATE" | "DELETE") => {
				const body = payload?.payload ?? payload ?? {};
				const table = body?.table || body?.table_name;
				const schema = body?.schema || body?.table_schema;
				if (schema && schema !== "public") return;
				if (table && table !== "chats") return;
				const newRow = (body?.record ?? body?.new ?? payload?.new) as ChatWithPin | undefined;
				const oldRow = (body?.old_record ?? body?.old ?? payload?.old) as ChatWithPin | undefined;
				setChatHistory((prev) => {
					if (expectedEvent === "INSERT" && newRow) {
						const exists = prev.some((chat) => chat.id === newRow.id);
						if (exists) return prev;
						return [newRow, ...prev];
					}
					if (expectedEvent === "UPDATE" && newRow) {
						const index = prev.findIndex((chat) => chat.id === newRow.id);
						if (index === -1) return [newRow, ...prev];
						return prev.map((chat) => (chat.id === newRow.id ? newRow : chat));
					}
					if (expectedEvent === "DELETE" && oldRow) {
						return prev.filter((chat) => chat.id !== oldRow.id);
					}
					return prev;
				});
			};

			channel
				.on("broadcast", { event: "INSERT" }, (p: any) => handleBroadcast(p, "INSERT"))
				.on("broadcast", { event: "UPDATE" }, (p: any) => handleBroadcast(p, "UPDATE"))
				.on("broadcast", { event: "DELETE" }, (p: any) => handleBroadcast(p, "DELETE"))
				.subscribe();

			// Fallback: Postgres Changes scoped to the user for redundancy
			try {
				changesChannel = supabase
					.channel(`chats:changes:${userId}`)
					.on(
						"postgres_changes",
						{ event: "*", schema: "public", table: "chats", filter: `user_id=eq.${userId}` },
						(payload) => {
							const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE" | string;
							const newRow = payload.new as ChatWithPin | undefined;
							const oldRow = payload.old as ChatWithPin | undefined;
							if (eventType === "INSERT" && newRow) {
								setChatHistory((prev) => {
									const exists = prev.some((chat) => chat.id === newRow.id);
									if (exists) return prev;
									return [newRow, ...prev];
								});
							}
							if (eventType === "UPDATE" && newRow) {
								setChatHistory((prev) => {
									const index = prev.findIndex((chat) => chat.id === newRow.id);
									if (index === -1) return [newRow, ...prev];
									return prev.map((chat) => (chat.id === newRow.id ? newRow : chat));
								});
							}
							if (eventType === "DELETE" && oldRow) {
								setChatHistory((prev) => prev.filter((chat) => chat.id !== oldRow.id));
							}
						},
					)
					.subscribe();
			} catch {}

		};

		init();

		return () => {
			try {
				if (channel) supabase.removeChannel(channel);
				if (changesChannel) supabase.removeChannel(changesChannel);
			} catch {}
			isMounted = false;
			if (timer) clearTimeout(timer);
		};
	}, []);

	// Optimistic local delete handler to immediately remove from UI in case realtime is delayed
	useEffect(() => {
		const onDeleted = (e: Event) => {
			const ev = e as CustomEvent<{ chatId: string }>;
			const deletedId = ev?.detail?.chatId;
			if (!deletedId) return;
			setChatHistory((prev) => prev.filter((c) => c.id !== deletedId));
		};
		// @ts-ignore CustomEvent typing at window
		window.addEventListener("chat:deleted", onDeleted as any);
		return () => window.removeEventListener("chat:deleted", onDeleted as any);
	}, []);

	// Keep Realtime Authorization token fresh on session changes
	useEffect(() => {
		const { data: authSub } = supabase.auth.onAuthStateChange(async (_event, session) => {
			try {
				if (session?.access_token) {
					// @ts-ignore setAuth availability differs by version
					await supabase.realtime.setAuth(session.access_token);
				}
			} catch {}
		});
		return () => {
			try {
				authSub?.subscription?.unsubscribe?.();
			} catch {}
		};
	}, []);

	// Server query already orders pinned first; keep client-side sort for safety
	const sortedChatHistory = useMemo(() => {
		return [...chatHistory].sort((a, b) => {
			const aPinned = Boolean(a.pinned_at);
			const bPinned = Boolean(b.pinned_at);
			if (aPinned !== bPinned) return aPinned ? -1 : 1;
			if (aPinned && bPinned) {
				return (
					new Date(b.pinned_at as string).getTime() -
					new Date(a.pinned_at as string).getTime()
				);
			}
			return (
				new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
			);
		});
	}, [chatHistory]);

	return (
		<>
			<Sidebar collapsible="icon" {...props}>
				<ChatSidebarHeader />

				<SidebarContent className="overflow-visible pr-2">
					<div className="min-h-0 h-full w-full overflow-y-auto">
						<SidebarMenu className="group-data-[collapsible=icon]:hidden px-0">
							{sortedChatHistory.map((chat) => {
								const isActive = chat.id === currentChatId;
								return <ChatItem key={chat.id} chat={chat} isActive={isActive} />;
							})}
						</SidebarMenu>
					</div>
				</SidebarContent>

				<SidebarFooter>
					<ChatSidebarFooter
						displayName={displayName}
						userEmail={userEmail}
						onLogout={handleLogout}
					/>
				</SidebarFooter>
				<SidebarRail />
			</Sidebar>
		</>
	);
}
