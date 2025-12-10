"use client";
import { createContext, useContext, useRef, useState } from "react";
import { useChat, UseChatHelpers } from "@ai-sdk/react";
import * as db from "@/lib/db/client";
import { useEffect } from "react";
import { CACHE_TTL_SECONDS } from "@/lib/cache/config";
import { AppUIMessage } from "@/types/ui";
import { DefaultChatTransport } from "ai";
import { mapUiPartsToDbParts } from "@/lib/utils/message-mapper";
import { toast } from "sonner";

type ChatContextType = UseChatHelpers<AppUIMessage> & {
	model: string;
	setModel: React.Dispatch<React.SetStateAction<string>>;
	chatId: string | undefined;
	setChatId: React.Dispatch<React.SetStateAction<string | undefined>>;
	sendUserMessage: (
		options: { text: string } & Record<string, unknown>,
		onAfterSend?: (detail: { chatId: string; messageId: string; isNewChat: boolean }) => void | Promise<void>,
	) => Promise<void>;
};

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({
	children,
	initialMessages,
	chatId,
}: {
	children: React.ReactNode;
	initialMessages: AppUIMessage[];
	chatId: string | undefined;
}) => {
	const [model, setModel] = useState("gpt-4.1-nano");
	const [chatIdState, setChatId] = useState(chatId);
	
	// Use a stable ID for useChat even when chatId is undefined (new chat)
	// This ensures useChat properly tracks messages before the real chat ID is created
	const [stableUseChatId] = useState(() => chatId ?? `temp-${crypto.randomUUID()}`);

	const latestChatId = useRef(chatIdState);
	const creatingChatRef = useRef<Promise<string> | null>(null);
	const firstUserPersistPromiseRef = useRef<Promise<void> | null>(null);
	// Track if we need to navigate after streaming completes (for new chats)
	const needsNavigationRef = useRef(false);

	useEffect(() => {
		latestChatId.current = chatIdState;
	}, [chatIdState]);

	// Create a ref to track the current model for the body callback
	const modelRef = useRef(model);
	useEffect(() => {
		modelRef.current = model;
	}, [model]);

	// Memoize transport to avoid recreating on every render
	const transportRef = useRef(new DefaultChatTransport({ api: "/api/chat" }));

	const chat = useChat({
		id: stableUseChatId,
		messages: initialMessages,
		transport: transportRef.current,
		// Pass model dynamically via experimental_prepareRequestBody
		experimental_prepareRequestBody: ({ messages, id }) => ({
			messages,
			model: modelRef.current,
			id,
		}),
		onError: (error) => {
			console.error("Chat error:", error);
			// Parse user-friendly error message
			let errorMessage = "Something went wrong. Please try again.";
			const errorText = error.message || String(error);
			
			if (errorText.includes("quota") || errorText.includes("RESOURCE_EXHAUSTED")) {
				errorMessage = "API quota exceeded. Please try a different model or wait a moment.";
			} else if (errorText.includes("rate limit") || errorText.includes("429")) {
				errorMessage = "Rate limit reached. Please wait a moment and try again.";
			} else if (errorText.includes("API key") || errorText.includes("unauthorized") || errorText.includes("401")) {
				errorMessage = "API authentication error. Please check the configuration.";
			}
			
			toast.error("Chat Error", { description: errorMessage });
		},
		onFinish: async ({ message }) => {
			let resolvedChatId = latestChatId.current;
			if (!resolvedChatId && creatingChatRef.current) {
				try {
					resolvedChatId = await creatingChatRef.current;
				} catch { /* swallow create errors for UI */ }
			}
			if (!resolvedChatId) return;

			const created = await db.messages.createMessage(
				resolvedChatId,
				"assistant",
				model,
			);

			const dbParts = mapUiPartsToDbParts(message.parts);
			await db.messageParts.createParts(created.id, dbParts);

			// After stream completes: ensure first user message persisted before caching
			try {
				if (firstUserPersistPromiseRef.current) {
					try { await firstUserPersistPromiseRef.current; } catch { }
				}
				// Now safe to append assistant to cache; user should already be cached or will be read from DB
				try {
					const key = `cache:v1:messages:byChat:${resolvedChatId}`;
					await fetch("/api/cache/write-through", {
						method: "POST",
						body: JSON.stringify({
							key,
							append: [created],
							ex: CACHE_TTL_SECONDS,
						}),
					});
				} catch { }
				// URL was already updated via history.replaceState in sendUserMessage.
				// Don't navigate here - it would cause a page reload and interrupt the UX.
				// The messages are persisted and will load correctly on manual refresh.
				needsNavigationRef.current = false;
			} catch { }
		},
	});

	// Reset chat state when navigating to a new chat
	// Track the initialMessages array reference - it's a new array on each server render
	const prevInitialMessagesRef = useRef(initialMessages);
	useEffect(() => {
		// If initialMessages reference changed and it's empty, but we have client-side state, reset
		const isNewEmptyChat = initialMessages !== prevInitialMessagesRef.current && initialMessages.length === 0;
		const hasClientState = latestChatId.current !== undefined || chat.messages.length > 0;
		
		if (isNewEmptyChat && hasClientState) {
			chat.setMessages([]);
			// Reset refs for new chat
			latestChatId.current = undefined;
			creatingChatRef.current = null;
			firstUserPersistPromiseRef.current = null;
			needsNavigationRef.current = false;
			setChatId(undefined);
		}
		prevInitialMessagesRef.current = initialMessages;
	}, [initialMessages, chat]);

	async function sendUserMessage(
		options: { text: string } & Record<string, unknown>,
		onAfterSend?: (detail: { chatId: string; messageId: string; isNewChat: boolean }) => void | Promise<void>,
	) {
		const { text } = options;
		
		let cid = latestChatId.current;
		const isNewAtSend = !cid;
		if (!cid && !creatingChatRef.current) {
			// Mark that we need to navigate after streaming completes
			needsNavigationRef.current = true;
			creatingChatRef.current = db.chats.createChat("New Chat").then((createdChat) => {
				latestChatId.current = createdChat.id; // keep id for persistence only
				// NOTE: Do NOT call setChatId here - it would reset useChat's internal messages
				// The chatIdState will be updated after streaming completes via router.replace()
				return createdChat.id;
			});
		}

		// Start streaming immediately (do not block on chat creation)
		// sendMessage adds the user message to messages array AND triggers AI response
		chat.sendMessage({ text });

		// Background: persist + callback + cache
		const persistUser = (async () => {
			try {
				const effectiveChatId = cid ?? (creatingChatRef.current ? await creatingChatRef.current : undefined);
				if (!effectiveChatId) return;
				const created = await db.messages.createMessage(effectiveChatId, "user", model);

				// Fire callback ASAP with real ids
				try {
					if (onAfterSend) await onAfterSend({ chatId: effectiveChatId, messageId: created.id, isNewChat: isNewAtSend });
				} catch { }

				const parts = mapUiPartsToDbParts([{ type: "text", text }] as any);
				if (parts.length) await db.messageParts.createParts(created.id, parts);

				try {
					const key = `cache:v1:messages:byChat:${effectiveChatId}`;
					await fetch("/api/cache/write-through", {
						method: "POST",
						body: JSON.stringify({ key, append: [created], ex: CACHE_TTL_SECONDS }),
					});
				} catch { }
				// Update URL to the concrete chat route without remounting the component.
				// Using history.replaceState preserves the streaming state during new chat creation.
				try {
					const targetPath = `/chat/${effectiveChatId}`;
					if (window.location.pathname !== targetPath) {
						window.history.replaceState(null, '', targetPath);
					}
				} catch { }
			} catch { }
		})();
		// Track the first user-message persistence to coordinate navigation timing
		if (!firstUserPersistPromiseRef.current) {
			firstUserPersistPromiseRef.current = persistUser;
			persistUser.finally(() => {
				// reset so subsequent sends don't await unnecessarily
				firstUserPersistPromiseRef.current = null;
			});
		}
	}

	return (
		<ChatContext.Provider
			value={{ ...chat, model, setModel, chatId: chatIdState, setChatId, sendUserMessage }}
		>
			{children}
		</ChatContext.Provider>
	);
};

export const useChatContext = () => {
	const context = useContext(ChatContext);
	if (context === null) {
		throw new Error("useChatContext must be used within a ChatProvider");
	}
	return context;
};
