import { AppUIMessage } from "@/types/ui";
import ChatContainer from "@/components/chat-container";

interface ChatClientServerProps {
	chatId: string | undefined;
	initialMessages: AppUIMessage[];
}

/**
 * Server-rendered chat client that passes data to the client container.
 * The ChatContainer handles caching and navigation without loading states.
 */
export default function ChatClientServer({
	chatId,
	initialMessages,
}: ChatClientServerProps) {
	return (
		<ChatContainer serverChatId={chatId} serverMessages={initialMessages} />
	);
}
