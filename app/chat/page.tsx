import { ChatInput } from "@/components/chat-input";
import { createClient } from "@/lib/supabase/server";

import "katex/dist/katex.min.css";
import { MessagesList } from "@/components/messages-list";
import { ChatProvider } from "@/contexts/chat-context";
import * as db  from "@/lib/db/index";
import { Message } from "@/types/db";

export default async function ChatPage() {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.getUser();

	if (error) {
		throw error;
	}
	const initialMessages: Message[] = [
		{
			id: "1",
			role: "user",
			content: "Hello! How can I assist you today?",
			chat_id: "1",
			created_at: new Date().toISOString(),
			model_used: "gemini-2.0-flash-exp",
			tokens_used: 100,
			user_id: data.user.id
		},
		{
			id: "2",
			role: "assistant",
			content: "Hi! I need some help with my subscription.",
			chat_id: "1",
			created_at: new Date().toISOString(),
			model_used: "gemini-2.0-flash-exp",
			tokens_used: 100,
			user_id: data.user.id
		}
	];

	// const initialMessages = await db.messages.getMessagesByUserId(data.user.id);
	return (
		<ChatProvider initialMessages={initialMessages}>
			<div className="flex flex-col h-full" style={{ backgroundColor: "#1A1A1A" }}>
				<MessagesList  />

				{/* Chat Input Component */}
				<ChatInput />
			</div>
		</ChatProvider>
	);
}