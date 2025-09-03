"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import * as db from "@/lib/db/client";

/**
 * Custom hook for managing chat actions like delete, rename, etc.
 */
export function useChatActions() {
	const router = useRouter();
	const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
	const [renameValue, setRenameValue] = useState<string>("");

	/**
	 * Returns a delete handler function that can be used directly in onClick events
	 */
	const handleDeleteChat = (chatId: string, isActive?: boolean) => {
		return async (e?: React.MouseEvent) => {
			// Prevent the underlying chat link from navigating when clicking Delete
			try {
				e?.preventDefault?.();
				e?.stopPropagation?.();
			} catch {}
			try {
				await db.chats.deleteChat(chatId);
				// Notify UI immediately for optimistic sidebar update
				try {
					// @ts-ignore CustomEvent typing
					window.dispatchEvent(new CustomEvent("chat:deleted", { detail: { chatId } }));
				} catch {}
				// Fire-and-forget cache invalidation to reclaim bytes immediately
				try {
					await fetch("/api/cache/invalidate", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							keys: [`cache:v1:messages:byChat:${chatId}`],
						}),
						cache: "no-store",
					});
				} catch (_) {}
				// If deleting the active chat, replace history so back won't return to it
				if (isActive) {
					router.replace("/chat");
				}
			} catch (error) {
				console.error("Failed to delete chat:", error);
				// Could extend this to show user-facing error messages
			}
		};
	};

	/**
	 * Initiates rename mode for a specific chat
	 */
	const handleStartRename = async (chatId: string) => {
		try {
			const currentTitle = await db.chats.getChatTitle(chatId);
			setRenamingChatId(chatId);
			setRenameValue(currentTitle || "");
		} catch (error) {
			console.error("Failed to get chat title:", error);
		}
	};

	/**
	 * Saves the new chat title and exits rename mode
	 */
	const handleSaveRename = async (
		chatId: string,
		onUpdate?: (chatId: string, newTitle: string) => void,
	) => {
		if (!renameValue.trim()) {
			handleCancelRename();
			return;
		}

		try {
			await db.chats.updateChatTitle(chatId, renameValue.trim());

			// Call the optional callback to update parent state immediately
			onUpdate?.(chatId, renameValue.trim());

			setRenamingChatId(null);
			setRenameValue("");
		} catch (error) {
			console.error("Failed to update chat title:", error);
		}
	};

	/**
	 * Cancels rename mode without saving
	 */
	const handleCancelRename = () => {
		setRenamingChatId(null);
		setRenameValue("");
	};

	/**
	 * Handles keyboard events during rename (Enter to save, Escape to cancel)
	 */
	const handleRenameKeyDown = (
		e: React.KeyboardEvent,
		chatId: string,
		onUpdate?: (chatId: string, newTitle: string) => void,
	) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSaveRename(chatId, onUpdate);
		} else if (e.key === "Escape") {
			handleCancelRename();
		}
	};

	/**
	 * Updates the rename input value
	 */
	const handleRenameValueChange = (value: string) => {
		setRenameValue(value);
	};

	/**
	 * Checks if a specific chat is currently being renamed
	 */
	const isRenaming = (chatId: string) => renamingChatId === chatId;

	/**
	 * Toggles the pin status of a specific chat
	 */
	const handleTogglePin = (chat: { id: string; pinned_at?: string | null }) => {
		return async (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			try {
				if (chat.pinned_at) {
					await db.chats.unpinChat(chat.id);
					// Fire-and-forget cache pin sync
					try {
						await fetch("/api/cache/pins", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ chatId: chat.id, pinned: false }),
							cache: "no-store",
						});
					} catch {}
				} else {
					await db.chats.pinChat(chat.id);
					try {
						await fetch("/api/cache/pins", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ chatId: chat.id, pinned: true }),
							cache: "no-store",
						});
					} catch {}
					// Opportunistically warm the pinned chat's messages cache
					try {
						const controller = new AbortController();
						const id = setTimeout(() => controller.abort(), 3000);
						await fetch(
							`/api/cache/warm-chat?chatId=${encodeURIComponent(chat.id)}`,
							{
								method: "GET",
								cache: "no-store",
								signal: controller.signal,
							},
						).finally(() => clearTimeout(id));
					} catch {}
				}
			} catch (error) {
				console.error("Failed to toggle pin:", error);
			}
		};
	};

	return {
		// Delete functionality
		handleDeleteChat,

		// Rename functionality
		handleStartRename,
		handleSaveRename,
		handleCancelRename,
		handleRenameKeyDown,
		handleRenameValueChange,
		isRenaming,
		renameValue,
		renamingChatId,

		// Pin functionality
		handleTogglePin,
	};
}
