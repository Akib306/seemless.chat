"use client";
import { createContext, useContext, useRef, useState } from "react";
import { useChat, UseChatHelpers } from "@ai-sdk/react";
import { Message } from "@/types/db";
import * as db from "@/lib/db/client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CACHE_TTL_SECONDS } from "@/lib/cache/quota";

type ChatContextType = UseChatHelpers & {
	model: string;
	setModel: React.Dispatch<React.SetStateAction<string>>;
	chatId: string | null;
	setChatId: React.Dispatch<React.SetStateAction<string | null>>;
};

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({
	children,
	initialMessages,
	chatId,
}: {
	children: React.ReactNode;
	initialMessages: Message[];
	chatId: string | null;
}) => {
	const [model, setModel] = useState("gemini-2.0-flash");
	const [chatIdState, setChatId] = useState(chatId);
	const router = useRouter();
	const pathname = usePathname();

	const latestChatId = useRef(chatIdState);
	const isNewChat = useRef(chatId === null);

	useEffect(() => {
		latestChatId.current = chatIdState;
		// If chatId changes from null to something, it's no longer a new chat
	}, [chatIdState]);

	const chat = useChat({
		api: "/api/chat",
		body: {
			model,
			chatId: latestChatId.current,
		},
		initialMessages: initialMessages.map((message) => ({
			id: message.id,
			// No mapping needed; use the role from the database directly.
			role: message.role as "user" | "assistant" | "system" | "data",
			content: message.content,
		})),
		onFinish: async (message, options) => {
			if (latestChatId.current) {
				// Persist assistant response. TODO: replace 'system' with actual userId once auth context is integrated.
				await db.messages.createMessage(
					latestChatId.current,
					message.content,
					"assistant",
					model,
				);

				// Write-through cache: append the assistant message to cached array
				try {
					const key = `cache:v1:messages:byChat:${latestChatId.current}`;
					const res = await fetch("/api/cache/write-through", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							key,
							append: [{
								id: message.id,
								chat_id: latestChatId.current,
								content: message.content,
								role: "assistant",
								model_used: model,
								created_at: new Date().toISOString(),
							}],
                            ex: CACHE_TTL_SECONDS,
						}),
					});
					// ignore response in UI
				} catch (_) {}
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
