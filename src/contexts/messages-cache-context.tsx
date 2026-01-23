"use client";

import { createContext, useContext, useRef, useState, useCallback } from "react";
import type { AppUIMessage } from "@/types/ui";

interface MessagesCacheContextType {
	/** Get cached messages for a chat, or undefined if not cached */
	getMessages: (chatId: string) => AppUIMessage[] | undefined;
	/** Set messages for a chat in the cache */
	setMessages: (chatId: string, messages: AppUIMessage[]) => void;
	/** Check if a chat's messages are cached */
	isCached: (chatId: string) => boolean;
	/** Clear messages for a specific chat */
	clearChat: (chatId: string) => void;
	/** Current chat ID being viewed (for client-side navigation) */
	currentChatId: string | undefined;
	/** Set the current chat ID (used for client-side navigation) */
	setCurrentChatId: (chatId: string | undefined) => void;
	/** Loading state for fetching messages */
	isLoading: boolean;
	/** Set loading state */
	setIsLoading: (loading: boolean) => void;
}

const MessagesCacheContext = createContext<MessagesCacheContextType | null>(null);

/**
 * Provider for client-side message caching.
 * This enables instant navigation between chats that have already been loaded.
 */
export function MessagesCacheProvider({ children }: { children: React.ReactNode }) {
	// Use a ref for the cache to avoid re-renders when cache updates
	const cacheRef = useRef<Map<string, AppUIMessage[]>>(new Map());
	// Track current chat for client-side navigation
	const [currentChatId, setCurrentChatId] = useState<string | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(false);

	const getMessages = useCallback((chatId: string): AppUIMessage[] | undefined => {
		return cacheRef.current.get(chatId);
	}, []);

	const setMessages = useCallback((chatId: string, messages: AppUIMessage[]): void => {
		cacheRef.current.set(chatId, messages);
	}, []);

	const isCached = useCallback((chatId: string): boolean => {
		return cacheRef.current.has(chatId);
	}, []);

	const clearChat = useCallback((chatId: string): void => {
		cacheRef.current.delete(chatId);
	}, []);

	return (
		<MessagesCacheContext.Provider
			value={{
				getMessages,
				setMessages,
				isCached,
				clearChat,
				currentChatId,
				setCurrentChatId,
				isLoading,
				setIsLoading,
			}}
		>
			{children}
		</MessagesCacheContext.Provider>
	);
}

export function useMessagesCache() {
	const context = useContext(MessagesCacheContext);
	if (context === null) {
		throw new Error("useMessagesCache must be used within a MessagesCacheProvider");
	}
	return context;
}
