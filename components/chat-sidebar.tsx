"use client";
import type * as React from "react";
import Image from "next/image";

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
import { Plus } from "lucide-react";
import * as db from "@/lib/db/client";
import { Chat } from "@/types/db";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
	e.preventDefault();
	e.stopPropagation();

	try {
		await db.chats.deleteChat(chatId);
	} catch (error) {
		console.error("Failed to delete chat:", error);
	}
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const router = useRouter();
	const [chatHistory, setChatHistory] = useState<Chat[]>([]);

	useEffect(() => {
		const fetchChatHistory = async () => {
			const userId = await db.getCurrentUserId();
			const chats = await db.chats.getChatsByUserId(userId);
			setChatHistory(chats);
		};
		fetchChatHistory();
		// ✅ Optimized realtime listener with duplicate prevention
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
			{/* Fixed header that's always visible */}
			<div className="fixed top-4 left-4 z-50 flex items-center gap-2">
				<div className="relative w-10 h-10">
					<Image
						src="/logo.svg"
						alt="Seemless Chat Logo"
						fill
						className="object-contain"
						style={{
							filter:
								"invert(45%) sepia(80%) saturate(1000%) hue-rotate(200deg) brightness(90%) contrast(90%)",
						}}
					/>
				</div>
				<span className="font-semibold text-base">Seemless Chat</span>
				<SidebarTrigger className="h-10 w-10" />
			</div>

			<Sidebar collapsible="offcanvas" {...props}>
				<SidebarHeader className="pt-16">
					<div className="px-2 py-2">
						<Button
							variant="default"
							className="w-full flex items-center justify-center gap-2"
							onClick={() => {
								router.push("/chat");
							}}
						>
							<Plus className="h-4 w-4" />
							New Chat
						</Button>
					</div>
					<SearchForm placeholder="Search chat history..." />
				</SidebarHeader>

				<SidebarContent>
					<SidebarMenu>
						{chatHistory.map((chat) => (
							<SidebarMenuItem className="px-3" key={chat.id}>
								<SidebarMenuButton
									asChild
									className="flex flex-col items-start hover:bg-secondary"
								>
									<Link href={`/chat/${chat.id}`} className="w-full">
										<div className="w-full flex justify-between items-start">
											<div className="flex-1 text-base">
												{chat.title}
											</div>

											<DropdownMenu>
												<DropdownMenuTrigger
													className="md:opacity-0 group-hover/menu-item:opacity-100
                                    group-focus-within/menu-item:opacity-100"
												>
													<EllipsisVertical className="h-5 w-5" />
												</DropdownMenuTrigger>
												<DropdownMenuContent
													side="right"
													align="start"
													sideOffset={20}
												>
													<DropdownMenuItem>Pin</DropdownMenuItem>
													<DropdownMenuItem>Rename</DropdownMenuItem>
													<DropdownMenuItem
														onClick={(e) => handleDeleteChat(chat.id, e)}
													>
														{" "}
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarContent>
				<SidebarRail />
			</Sidebar>
		</>
	);
}
