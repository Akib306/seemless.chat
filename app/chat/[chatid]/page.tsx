import ChatClient from "@/components/chat-client";
import * as db from "@/lib/db/index";

export default async function ChatPage({
	params,
}: {
	params: Promise<{ chatid: string }>;
}) {
	const { chatid } = await params;
	const initialMessages = await db.messages.getMessagesByChatId(chatid);
	//console.log(initialMessages)
	return <ChatClient chatId={chatid} initialMessages={initialMessages} />;
}
