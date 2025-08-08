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
import {
  Crown,
  SlidersHorizontal,
  Settings as SettingsIcon,
  LifeBuoy,
  LogOut,
  CircleUser,
} from "lucide-react";

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
  	const [profile, setProfile] = useState<Profile | null>(null);
  	const [userEmail, setUserEmail] = useState<string | null>(null);

	const displayName = (profile?.username ?? userEmail ?? "User");

	const handleLogout = async () => {
		await supabase.auth.signOut();
		router.push("/auth/login");
	};

	useEffect(() => {
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

				<SidebarFooter className="border-t border-sidebar-border">
					{/* Expanded footer with menu trigger */}
					<div className="group-data-[collapsible=icon]:hidden">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button className="w-full flex items-center justify-between gap-3 rounded-2xl px-3 py-2 bg-sidebar-accent/40 border border-sidebar-border/60 transition-colors hover:bg-sidebar-accent/60">
									<span className="flex items-center gap-3">
										<Avatar>
											<AvatarImage src={undefined} alt={displayName} />
											<AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
										</Avatar>
										<span className="flex flex-col items-start">
											<span className="text-sm font-medium leading-5">{displayName}</span>
											<span className="text-xs text-muted-foreground leading-4">Free</span>
										</span>
									</span>
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" side="top" sideOffset={8} className="w-80 rounded-2xl p-2 shadow-xl border border-sidebar-border/60">
								<DropdownMenuLabel className="font-normal">
									<div className="flex items-center gap-2 text-muted-foreground">
										<CircleUser className="h-4 w-4" />
										<p className="text-sm leading-none">{userEmail ?? displayName}</p>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem className="rounded-xl px-3 py-2 text-base" onSelect={(e) => { e.preventDefault(); /* route later */ }}>
									<Crown className="mr-2 h-4 w-4" /> Upgrade plan
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-xl px-3 py-2 text-base" onSelect={(e) => { e.preventDefault(); }}>
									<SlidersHorizontal className="mr-2 h-4 w-4" /> Customize
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-xl px-3 py-2 text-base" onSelect={(e) => { e.preventDefault(); }}>
									<SettingsIcon className="mr-2 h-4 w-4" /> Settings
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuSub>
									<DropdownMenuSubTrigger className="rounded-xl px-3 py-2 text-base">
										<LifeBuoy className="mr-2 h-4 w-4" /> Help
									</DropdownMenuSubTrigger>
									<DropdownMenuSubContent className="rounded-xl p-2">
										<DropdownMenuItem className="rounded-lg px-3 py-2" onSelect={(e) => { e.preventDefault(); }}>
											Documentation
										</DropdownMenuItem>
										<DropdownMenuItem className="rounded-lg px-3 py-2" onSelect={(e) => { e.preventDefault(); }}>
											Contact support
										</DropdownMenuItem>
									</DropdownMenuSubContent>
								</DropdownMenuSub>
								<DropdownMenuSeparator />
								<DropdownMenuItem onSelect={handleLogout} className="rounded-xl px-3 py-2 text-base text-red-600 focus:text-red-600">
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
										<AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
									</Avatar>
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" side="right" sideOffset={8} className="w-80 rounded-2xl p-2 shadow-xl border border-sidebar-border/60">
								<DropdownMenuLabel className="font-normal">
									<div className="flex items-center gap-2 text-muted-foreground">
										<CircleUser className="h-4 w-4" />
										<p className="text-sm leading-none">{userEmail ?? displayName}</p>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem className="rounded-xl px-3 py-2 text-base" onSelect={(e) => { e.preventDefault(); }}>
									<Crown className="mr-2 h-4 w-4" /> Upgrade plan
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-xl px-3 py-2 text-base" onSelect={(e) => { e.preventDefault(); }}>
									<SlidersHorizontal className="mr-2 h-4 w-4" /> Customize
								</DropdownMenuItem>
								<DropdownMenuItem className="rounded-xl px-3 py-2 text-base" onSelect={(e) => { e.preventDefault(); }}>
									<SettingsIcon className="mr-2 h-4 w-4" /> Settings
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuSub>
									<DropdownMenuSubTrigger className="rounded-xl px-3 py-2 text-base">
										<LifeBuoy className="mr-2 h-4 w-4" /> Help
									</DropdownMenuSubTrigger>
									<DropdownMenuSubContent className="rounded-xl p-2">
										<DropdownMenuItem className="rounded-lg px-3 py-2" onSelect={(e) => { e.preventDefault(); }}>
											Documentation
										</DropdownMenuItem>
										<DropdownMenuItem className="rounded-lg px-3 py-2" onSelect={(e) => { e.preventDefault(); }}>
											Contact support
										</DropdownMenuItem>
									</DropdownMenuSubContent>
								</DropdownMenuSub>
								<DropdownMenuSeparator />
								<DropdownMenuItem onSelect={handleLogout} className="rounded-xl px-3 py-2 text-base text-red-600 focus:text-red-600">
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
