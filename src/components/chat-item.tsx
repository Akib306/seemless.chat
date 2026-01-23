"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { EllipsisVertical, Trash2, Edit2, Pin, PinOff } from "lucide-react";

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Chat } from "@/types/db";
import { useChatActions } from "@/hooks/use-chat-actions";
import { useMessagesCache } from "@/contexts/messages-cache-context";

// Track last time each chat was warmed to avoid redundant requests while allowing re-warm
// after a short hover interval (10–15s) regardless of cache TTL
const warmedChatTimestamps = new Map<string, number>();
const HOVER_REWARM_INTERVAL_MS = 12_000; // re-warm if > ~12s since last hover

interface ChatItemProps {
	chat: Chat & { pinned_at?: string | null };
	isActive: boolean;
}

export function ChatItem({ chat, isActive }: ChatItemProps) {
	const router = useRouter();
	const { isCached, setMessages, setIsLoading } = useMessagesCache();
	const {
		handleDeleteChat,
		handleStartRename,
		handleSaveRename,
		handleRenameKeyDown,
		handleRenameValueChange,
		handleTogglePin,
		isRenaming,
		renameValue,
	} = useChatActions();

	const chatIsRenaming = isRenaming(chat.id);

	// Navigate to chat using client-side routing when cached
	const handleNavigate = React.useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();

			const targetPath = `/chat/${chat.id}`;
			if (window.location.pathname === targetPath) {
				return; // Already on this chat
			}

			// If cached, use shallow navigation (history.pushState) to avoid server re-render
			if (isCached(chat.id)) {
				window.history.pushState(null, "", targetPath);
				// Dispatch popstate to notify ChatContainer of URL change
				window.dispatchEvent(new PopStateEvent("popstate"));
			} else {
				// Not cached - prefetch then navigate with shallow routing
				setIsLoading(true);
				try {
					const response = await fetch(`/api/messages/${encodeURIComponent(chat.id)}`);
					if (response.ok) {
						const data = await response.json();
						setMessages(chat.id, data.messages ?? []);
						// Now navigate shallowly since we have the data
						window.history.pushState(null, "", targetPath);
						window.dispatchEvent(new PopStateEvent("popstate"));
					} else {
						// Fallback to full navigation
						router.push(targetPath);
					}
				} catch {
					// Fallback to full navigation
					router.push(targetPath);
				} finally {
					setIsLoading(false);
				}
			}
		},
		[chat.id, isCached, setMessages, setIsLoading, router]
	);

	// Warm this chat's messages cache on hover/focus to make navigation instant
	const warmOnIntent = React.useCallback(() => {
		if (!chat?.id) return;
		
		// Skip warming if already cached client-side
		if (isCached(chat.id)) return;
		
		const last = warmedChatTimestamps.get(chat.id) || 0;
		if (Date.now() - last < HOVER_REWARM_INTERVAL_MS) return;
		// Optimistically stamp now; if request fails, allow retry by clearing the stamp
		warmedChatTimestamps.set(chat.id, Date.now());

		// Prefetch to client-side cache instead of just warming Redis
		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), 10_000);
		fetch(`/api/messages/${encodeURIComponent(chat.id)}`, {
			method: "GET",
			cache: "no-store",
			signal: controller.signal,
		})
			.then(async (res) => {
				if (res.ok) {
					const data = await res.json();
					setMessages(chat.id, data.messages ?? []);
				} else {
					warmedChatTimestamps.delete(chat.id);
				}
			})
			.catch(() => {
				warmedChatTimestamps.delete(chat.id);
			})
			.finally(() => clearTimeout(id));
	}, [chat?.id, isCached, setMessages]);

	return (
		<SidebarMenuItem className="px-2 py-0" key={chat.id}>
			<SidebarMenuButton
				asChild
				isActive={isActive}
				className="flex flex-col items-start py-1 rounded-lg focus-visible:ring-0"
				tooltip={chat.title || "Chat"}
			>
				{chatIsRenaming ? (
					<div className="w-full">
						<div className={cn("w-full flex justify-between items-start")}>
							<Input
								value={renameValue}
								onChange={(e) => handleRenameValueChange(e.target.value)}
								onKeyDown={(e) => handleRenameKeyDown(e, chat.id)}
								onBlur={() => handleSaveRename(chat.id)}
								className="flex-1 text-base h-auto p-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
								autoFocus
							/>

							<DropdownMenu>
								<DropdownMenuTrigger className="md:opacity-0 group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100">
									<EllipsisVertical className="h-5 w-5" />
								</DropdownMenuTrigger>
								<DropdownMenuContent side="right" align="start" sideOffset={20}>
									<DropdownMenuItem onClick={handleTogglePin(chat)}>
										{chat.pinned_at ? (
											<PinOff className="mr-2 h-4 w-4" />
										) : (
											<Pin className="mr-2 h-4 w-4" />
										)}
										{chat.pinned_at ? "Unpin" : "Pin"}
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => handleStartRename(chat.id)}>
										<Edit2 className="mr-2 h-4 w-4" />
										Rename
									</DropdownMenuItem>
									<DropdownMenuItem onClick={handleDeleteChat(chat.id, isActive)}>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				) : (
					<a
						href={`/chat/${chat.id}`}
						className="w-full cursor-pointer"
						onClick={handleNavigate}
						onMouseEnter={warmOnIntent}
						onFocus={warmOnIntent}
					>
						<div
							className={cn(
								"w-full flex justify-between items-start",
								isActive && "text-foreground-primary",
							)}
						>
							<div
								className={cn(
									"flex-1 text-sm leading-6 text-ellipsis overflow-hidden whitespace-nowrap",
									isActive
										? "text-foreground-primary"
										: "text-foreground-muted group-hover/menu-item:text-foreground-primary",
								)}
							>
								{chat.title}
							</div>

							{/* Pin icon for pinned chats - visible by default, hidden on hover */}
							{chat.pinned_at && (
								<Pin className={cn("h-5 w-5 group-hover/menu-item:opacity-0 transition-opacity", isActive ? "text-foreground-primary" : "text-foreground-muted")} />
							)}

							<DropdownMenu>
								<DropdownMenuTrigger
									className={cn(
										"group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100 transition-opacity",
										chat.pinned_at ? "opacity-0" : "md:opacity-0",
									)}
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
									}}
								>
									<EllipsisVertical className="h-5 w-5" />
								</DropdownMenuTrigger>
								<DropdownMenuContent side="right" align="start" sideOffset={20} className="bg-card text-foreground-muted">
									<DropdownMenuItem onClick={handleTogglePin(chat)}
										className="hover:text-foreground-primary"
									>
										{chat.pinned_at ? (
											<PinOff className="mr-2 h-4 w-4" />
										) : (
											<Pin className="mr-2 h-4 w-4" />
										)}
										{chat.pinned_at ? "Unpin" : "Pin"}
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => handleStartRename(chat.id)}
										className="hover:text-foreground-primary"
									>
										<Edit2 className="mr-2 h-4 w-4" />
										Rename
									</DropdownMenuItem>
									<DropdownMenuItem onClick={handleDeleteChat(chat.id, isActive)}
										className="hover:text-foreground-primary"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</a>
				)}
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}
