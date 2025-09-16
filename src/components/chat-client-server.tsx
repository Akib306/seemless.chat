import Loading from "@/app/chat/loading";
import { AppUIMessage } from "@/types/ui";
import dynamic from "next/dynamic";
// Dynamically import the heavy client component with a loading fallback
const ChatClientInteractive = dynamic(
	() => import("@/components/chat-client-interactive"),
	{
		loading: () => <Loading />,
	}
);

interface ChatClientServerProps {
	chatId: string | undefined;
	initialMessages: AppUIMessage[];
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
		<ChatClientInteractive key={chatId ?? "new"} chatId={chatId} initialMessages={initialMessages} />
	);
}
