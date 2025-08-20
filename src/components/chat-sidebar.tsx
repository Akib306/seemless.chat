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
import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChatSidebarHeader } from "@/components/chat-sidebar-header";
import { ChatItem } from "@/components/chat-item";
import { createClient } from "@/lib/supabase/client";
import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/types/db";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { LogOut, CircleUser } from "lucide-react";

// Extended Chat type to include pinned_at until types are regenerated
type ChatWithPin = Chat & { pinned_at?: string | null };

const supabase = createClient();

export function ChatSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
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

			// Load profile and auth email
			try {
				const p = await db.profiles.getProfile(userId);
				setProfile(p);
			} catch {}
			const {
				data: { user },
			} = await supabase.auth.getUser();
			setUserEmail(user?.email ?? null);
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
								chat.id === payload.new.id
									? (payload.new as ChatWithPin)
									: chat,
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
				<SidebarHeader className="pt-2">
					<ChatSidebarHeader />
				</SidebarHeader>

				<SidebarContent>
					<SidebarMenu className="group-data-[collapsible=icon]:hidden px-2">
						<div className="px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground">
							Chats
						</div>
						{sortedChatHistory.map((chat) => {
							const isActive = chat.id === currentChatId;

							return <ChatItem key={chat.id} chat={chat} isActive={isActive} />;
						})}
					</SidebarMenu>
				</SidebarContent>

				<SidebarFooter>
					<div className="group-data-[collapsible=icon]:hidden">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 bg-transparent border border-transparent transition-colors hover:bg-sidebar-accent/40">
									<span className="flex items-center gap-3">
										<Avatar>
											<AvatarImage src={undefined} alt={displayName} />
											<AvatarFallback>
												{displayName.slice(0, 2).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<span className="flex flex-col items-start">
											<span className="text-sm font-medium leading-5">
												{displayName}
											</span>
											<span className="text-xs text-muted-foreground leading-4">
												Signed in
											</span>
										</span>
									</span>
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="start"
								side="top"
								sideOffset={8}
								className="w-80 rounded-2xl p-2 shadow-xl border border-sidebar-border/60"
							>
								<DropdownMenuLabel className="font-normal">
									<div className="flex items-center gap-2 text-muted-foreground">
										<CircleUser className="h-4 w-4" />
										<p className="text-sm leading-none">
											{userEmail ?? displayName}
										</p>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onSelect={handleLogout}
									className="rounded-xl px-3 py-2 text-base text-destructive focus:text-destructive"
								>
									<LogOut className="mr-2 h-4 w-4" /> Log out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Collapsed footer avatar only, also acts as menu trigger */}
					<div className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button aria-label="Open user menu" className="rounded-full">
									<Avatar>
										<AvatarImage src={undefined} alt={displayName} />
										<AvatarFallback>
											{displayName.slice(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="start"
								side="right"
								sideOffset={8}
								className="w-80 rounded-2xl p-2 shadow-xl border border-sidebar-border/60"
							>
								<DropdownMenuLabel className="font-normal">
									<div className="flex items-center gap-2 text-muted-foreground">
										<CircleUser className="h-4 w-4" />
										<p className="text-sm leading-none">
											{userEmail ?? displayName}
										</p>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onSelect={handleLogout}
									className="rounded-xl px-3 py-2 text-base text-destructive focus:text-destructive"
								>
									<LogOut className="mr-2 h-4 w-4" /> Log out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</SidebarFooter>
				<SidebarRail />
			</Sidebar>
		</>
	);
}
