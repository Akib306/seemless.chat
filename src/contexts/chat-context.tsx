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
	chatId: string | null;
	setChatId: React.Dispatch<React.SetStateAction<string | undefined>>;
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

	useEffect(() => {
		latestChatId.current = chatIdState;
		// If chatId changes from null to something, it's no longer a new chat
	}, [chatIdState]);

	const chat = useChat({
		id: chatId,
		messages: initialMessages,
		transport: new DefaultChatTransport({
			api: "/api/chat",
			prepareSendMessagesRequest: ({ messages }) => {
				const last = messages[messages.length - 1];
				console.log(messages)
				if (chatId) {
					void (async () => {
						try {
							const parent = await db.messages.createMessage(chatId, "user", model);
							const parts = mapUiPartsToDbParts((last as any).parts ?? (last as any).content ?? "");
							if (parts.length) await db.messageParts.createParts(parent.id, parts);
						} catch { }
					})();
				}

				return { body: { model, chatId, messages } };

			}
		}),
		onFinish: async ({ message }) => {
			if (latestChatId.current) {
				const created = await db.messages.createMessage(
					latestChatId.current,
					"assistant",
					model,
				);

				const dbParts = mapUiPartsToDbParts(message.parts);
				await db.messageParts.createParts(created.id, dbParts);

				// Write-through cache: append the assistant message to cached array
				try {
					const key = `cache:v1:messages:byChat:${latestChatId.current}`;
					const res = await fetch("/api/cache/write-through", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							key,
							append: [created],
							ex: CACHE_TTL_SECONDS,
						}),
					});
					// ignore response in UI
				} catch (_) { }
				// Navigate to the chat URL only when we are not already on it and avoid automatic scroll reset
				const targetPath = `/chat/${latestChatId.current}`;
				if (pathname !== targetPath) {
					router.push(targetPath, { scroll: false });
				}
			}
		},
	});

	return (
		<ChatContext.Provider
			value={{ ...chat, model, setModel, chatId: chatIdState, setChatId }}
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
