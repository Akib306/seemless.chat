import ChatClient from "@/components/chat-client";
import { createServerDb } from "@/lib/db/server";
import { redis } from "@/lib/db/redis";

export default async function ChatPage({
	params,
}: {
	params: Promise<{ chatid: string }>;
}) {
	const { chatid } = await params;
	const db = await createServerDb();
  const cacheKey = `cache:v1:messages:byChat:${chatid}`;
  const cached = await redis.get<any[]>(cacheKey);
  const initialMessages =
    cached ?? (await db.messages.getMessagesByChatId(chatid));

  if (!cached) {
    // Short TTL to reduce staleness while still offloading frequent reads
    await redis.set(cacheKey, initialMessages, { ex: 60 });
  }
	return <ChatClient chatId={chatid} initialMessages={initialMessages} />;
}
