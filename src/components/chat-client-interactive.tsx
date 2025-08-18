"use client";
import { ChatInput } from "@/components/chat-input";
import { MessagesList } from "@/components/messages-list";
import { ChatProvider } from "@/contexts/chat-context";
import { Message } from "@/types/db";

/**
 * Interactive chat client with full functionality.
 * This is now dynamically imported to reduce initial bundle size.
 */
export default function ChatClientInteractive({
	chatId,
	initialMessages,
}: {
	chatId: string | null;
	initialMessages: Message[];
}) {
	return (
		<ChatProvider initialMessages={initialMessages} chatId={chatId}>
			<div
				className="h-screen w-full flex flex-col overflow-hidden bg-background"
			>
				<div className="flex-1 min-h-0 overflow-auto flex justify-center">
					<MessagesList />
				</div>

				{/* 
                    This div is styled to always stay glued to the bottom of the viewport (visible area).
                    We use position: sticky and bottom: 0 so it remains visible at the bottom as you scroll.
                    The background ensures it doesn't overlap with content behind, and zIndex keeps it above other elements.
                */}
				<div className="flex-shrink-0 sticky bottom-0 left-0 w-full bg-background z-10">
					<ChatInput />
				</div>
			</div>
		</ChatProvider>
	);
}
