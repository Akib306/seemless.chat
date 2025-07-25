import ChatClient from "@/components/chat-client";

export default async function NewChatPage() {
	return <ChatClient chatId={null} initialMessages={[]} />;
}
