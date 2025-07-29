"use client";

import * as React from "react";
import Link from "next/link";
import { EllipsisVertical } from "lucide-react";

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
import { DropdownChatDelete } from "@/components/dropdown-chat-delete";

interface ChatItemProps {
	chat: Chat;
	isActive: boolean;
	isRenaming: boolean;
	renameValue: string;
	onRenameValueChange: (value: string) => void;
	onRenameKeyDown: (e: React.KeyboardEvent, chatId: string) => void;
	onRenameBlur: (chatId: string) => void;
	onToggleRename: (chatId: string) => void;
}

export function ChatItem({
	chat,
	isActive,
	isRenaming,
	renameValue,
	onRenameValueChange,
	onRenameKeyDown,
	onRenameBlur,
	onToggleRename,
	onDeleteChat,
}: ChatItemProps) {
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
								onChange={(e) => onRenameValueChange(e.target.value)}
								onKeyDown={(e) => onRenameKeyDown(e, chat.id)}
								onBlur={() => onRenameBlur(chat.id)}
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
									onClick={() => onToggleRename(chat.id)}
								>
									Rename
								</DropdownMenuItem>
								<DropdownChatDelete chatId={chat.id} />
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
} 