import ChatClientServer from "@/components/chat-client-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function NewChatPage() {
	return <ChatClientServer chatId={undefined} initialMessages={[]} />;
}
