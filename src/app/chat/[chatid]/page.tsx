import ChatClient from "@/components/chat-client";
import { createServerDb } from "@/src/lib/db/server";

export default async function ChatPage({
	params,
}: {
	params: Promise<{ chatid: string }>;
}) {
	const { chatid } = await params;
	const db = await createServerDb();
	const initialMessages = await db.messages.getMessagesByChatId(chatid);
	//console.log(initialMessages)
	return <ChatClient chatId={chatid} initialMessages={initialMessages} />;
}
