"use client";

import * as React from "react";
import Link from "next/link";
import { EllipsisVertical, Trash2, Edit2, Pin } from "lucide-react";

import {
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

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

interface ChatItemProps {
	chat: Chat & { pinned_at?: string | null };
	isActive: boolean;
}

export function ChatItem({
	chat,
	isActive,
}: ChatItemProps) {
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

	return (
		<SidebarMenuItem className="px-3 py-0" key={chat.id}>
			<SidebarMenuButton
				asChild
				isActive={isActive}
				className="flex flex-col items-start hover:bg-secondary py-1"
			>
				{chatIsRenaming ? (
					<div className="w-full">
						<div
							className={cn(
								"w-full flex justify-between items-start",
								isActive && "text-green-500",
							)}
						>
							<Input
								value={renameValue}
								onChange={(e) => handleRenameValueChange(e.target.value)}
								onKeyDown={(e) => handleRenameKeyDown(e, chat.id)}
								onBlur={() => handleSaveRename(chat.id)}
								className="flex-1 text-base h-auto p-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
								autoFocus
							/>

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
									<DropdownMenuItem onClick={handleTogglePin(chat)}>
										<Pin className="mr-2 h-4 w-4" />
										{chat.pinned_at ? "Unpin" : "Pin"}
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => handleStartRename(chat.id)}
									>
										<Edit2 className="mr-2 h-4 w-4" />
										Rename
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={handleDeleteChat(chat.id)}
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				) : (
					<Link href={`/chat/${chat.id}`} className="w-full">
						<div
							className={cn(
								"w-full flex justify-between items-start",
								isActive && "text-green-500",
							)}
						>
							<div className="flex-1 text-base">
								{chat.title}
							</div>

							<DropdownMenu>
								<DropdownMenuTrigger
									className="md:opacity-0 group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
									}}
								>
									<EllipsisVertical className="h-5 w-5" />
								</DropdownMenuTrigger>
								<DropdownMenuContent
									side="right"
									align="start"
									sideOffset={20}
								>
									<DropdownMenuItem onClick={handleTogglePin(chat)}>
										<Pin className="mr-2 h-4 w-4" />
										{chat.pinned_at ? "Unpin" : "Pin"}
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => handleStartRename(chat.id)}
									>
										<Edit2 className="mr-2 h-4 w-4" />
										Rename
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={handleDeleteChat(chat.id)}
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</Link>
				)}
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
} 