"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useMessagesCache } from "@/contexts/messages-cache-context";
import type { AppUIMessage } from "@/types/ui";
import ChatClientInteractive from "@/components/chat-client-interactive";

interface ChatContainerProps {
	/** Initial chat ID from server */
	serverChatId: string | undefined;
	/** Initial messages from server */
	serverMessages: AppUIMessage[];
}

/**
 * Client-side chat container that manages navigation between chats
 * without showing loading states for cached chats.
 */
export default function ChatContainer({
	serverChatId,
	serverMessages,
}: ChatContainerProps) {
	const { getMessages, setMessages, isLoading, setIsLoading } = useMessagesCache();

	// Track the active chat ID and its messages
	const [activeChatId, setActiveChatId] = useState<string | undefined>(serverChatId);
	const [activeMessages, setActiveMessages] = useState<AppUIMessage[]>(serverMessages);
	
	// Track if we've hydrated to avoid duplicate server data processing
	const hasHydratedRef = useRef(false);

	// Cache server-provided messages on mount
	useEffect(() => {
		if (!hasHydratedRef.current && serverChatId) {
			setMessages(serverChatId, serverMessages);
			hasHydratedRef.current = true;
		}
	}, [serverChatId, serverMessages, setMessages]);

	// Fetch messages for a chat from the API
	const fetchMessages = useCallback(
		async (chatId: string): Promise<AppUIMessage[] | null> => {
			try {
				const response = await fetch(`/api/messages/${encodeURIComponent(chatId)}`);
				if (!response.ok) {
					console.error("[ChatContainer] Failed to fetch messages:", response.status);
					return null;
				}
				const data = await response.json();
				return data.messages ?? [];
			} catch (error) {
				console.error("[ChatContainer] Error fetching messages:", error);
				return null;
			}
		},
		[]
	);

	// Navigate to a chat by ID - called from popstate listener
	const navigateToChat = useCallback(
		async (chatId: string | undefined) => {
			// Handle /chat (new chat) route
			if (!chatId) {
				setActiveChatId(undefined);
				setActiveMessages([]);
				setIsLoading(false);
				return;
			}

			// If already on this chat, nothing to do
			if (chatId === activeChatId) {
				return;
			}

			// Check if we have cached messages
			const cachedMessages = getMessages(chatId);

			if (cachedMessages !== undefined) {
				// Instantly load from cache - no loading state
				setActiveChatId(chatId);
				setActiveMessages(cachedMessages);
				setIsLoading(false);
			} else {
				// Need to fetch - show loading briefly then update
				setIsLoading(true);
				const messages = await fetchMessages(chatId);
				if (messages !== null) {
					setMessages(chatId, messages);
					setActiveChatId(chatId);
					setActiveMessages(messages);
				}
				setIsLoading(false);
			}
		},
		[activeChatId, getMessages, setMessages, fetchMessages, setIsLoading]
	);

	// Listen for popstate events (triggered by our client-side navigation)
	useEffect(() => {
		const handlePopState = () => {
			const currentChatId = extractChatId(window.location.pathname);
			navigateToChat(currentChatId);
		};

		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, [navigateToChat]);

	// Show a minimal loading state only when fetching uncached data
	if (isLoading) {
		return (
			<div className="h-screen w-full flex flex-col overflow-hidden bg-chat-background">
				<div className="flex-1 min-h-0 overflow-auto flex justify-center items-center">
					<div className="animate-pulse text-foreground-muted">Loading...</div>
				</div>
			</div>
		);
	}

	return (
		<ChatClientInteractive
			key={activeChatId ?? "new"}
			chatId={activeChatId}
			initialMessages={activeMessages}
		/>
	);
}

/**
 * Extract chatId from pathname like /chat/abc123
 */
function extractChatId(pathname: string): string | undefined {
	const segments = pathname.split("/");
	// /chat/abc123 => ["", "chat", "abc123"]
	if (segments.length >= 3 && segments[1] === "chat" && segments[2]) {
		return segments[2];
	}
	return undefined;
}
