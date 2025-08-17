import ChatClientServer from "@/components/chat-client-server";

export default async function NewChatPage() {
	return <ChatClientServer chatId={null} initialMessages={[]} />;
}
