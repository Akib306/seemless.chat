import { Message } from "@/types/db";
import Loading from "@/app/chat/loading";
import dynamic from "next/dynamic";

// Dynamically import the heavy client component with a loading fallback
const ChatClientInteractive = dynamic(
	() => import("@/components/chat-client-interactive"),
	{
		loading: () => <Loading />,
	}
);

interface ChatClientServerProps {
	chatId: string | null;
	initialMessages: Message[];
}

/**
 * Server-rendered chat client that lazy loads interactive components.
 * This reduces the initial compilation time by deferring heavy client components.
 */
export default function ChatClientServer({
	chatId,
	initialMessages,
}: ChatClientServerProps) {
	return (
		<ChatClientInteractive chatId={chatId} initialMessages={initialMessages} />
	);
}
