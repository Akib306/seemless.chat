"use client";
import { createContext, useContext, useRef, useState } from "react";
import { useChat, UseChatHelpers } from "@ai-sdk/react";
import * as db from "@/lib/db/client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CACHE_TTL_SECONDS } from "@/lib/cache/config";
import { AppUIMessage } from "@/types/ui";
import { DefaultChatTransport } from "ai";
import { mapUiPartsToDbParts } from "@/lib/utils/message-mapper";

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
	const [model, setModel] = useState("gemini-2.0-flash");
	const [chatIdState, setChatId] = useState(chatId);
	const router = useRouter();
	const pathname = usePathname();

	const latestChatId = useRef(chatIdState);
	const creatingChatRef = useRef<Promise<string> | null>(null);
	const firstUserPersistPromiseRef = useRef<Promise<void> | null>(null);

	useEffect(() => {
		latestChatId.current = chatIdState;
	}, [chatIdState]);

	const chat = useChat({
		id: chatIdState,
		messages: initialMessages,
		transport: new DefaultChatTransport({ api: "/api/chat" }),
		onFinish: async ({ message }) => {
			console.log(chatIdState)
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

			// After stream completes: ensure first user message persisted before caching/navigating
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
				const targetPath = `/chat/${resolvedChatId}`;
				if (pathname !== targetPath) {
					try { window.history.replaceState(null, "", targetPath); } catch { /* noop */ }
				}
			} catch { }
		},
	});

	async function sendUserMessage(
		options: { text: string } & Record<string, unknown>,
		onAfterSend?: (detail: { chatId: string; messageId: string; isNewChat: boolean }) => void | Promise<void>,
	) {
		const { text } = options;
		
		let cid = latestChatId.current;
		const isNewAtSend = !cid;
		if (!cid && !creatingChatRef.current) {
			creatingChatRef.current = db.chats.createChat("New Chat").then((createdChat) => {
				latestChatId.current = createdChat.id; // keep id for persistence
				return createdChat.id;
			});
		}

		// Start streaming immediately (do not block on chat creation)
		(chat as any).sendMessage({ text });

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
