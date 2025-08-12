import ChatClient from "@/components/chat-client";
import { createServerDb } from "@/lib/db/server";
import { redis } from "@/lib/db/redis";
import { CACHE_TTL_SECONDS, recordChatSize, heartbeat, ensureUnderQuota } from "@/lib/cache/quota";
import { createClient } from "@/lib/supabase/server";
// SSR: keep minimal

export default async function ChatPage({
	params,
}: {
	params: Promise<{ chatid: string }>;
}) {
	const { chatid } = await params;
  const cacheKey = `cache:v1:messages:byChat:${chatid}`;
  const cached = await redis.get<any[]>(cacheKey);
  let initialMessages = cached as any[] | null;
  if (!initialMessages) {
    const db = await createServerDb();
    initialMessages = await db.messages.getMessagesByChatId(chatid);
  }

  if (!cached) {
    await redis.set(cacheKey, initialMessages, { ex: CACHE_TTL_SECONDS });
    // SSR miss accounting: record size using Redis STRLEN and enforce quota (MISS is infrequent)
    try {
      const rawLen = await redis.strlen(cacheKey as any as string); // bytes of serialized value
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await recordChatSize(user.id, chatid, rawLen);
        const { perUserBudgetBytes } = await heartbeat(user.id);
        await ensureUnderQuota(user.id, perUserBudgetBytes);
      }
    } catch {}
  }
	return <ChatClient chatId={chatid} initialMessages={initialMessages} />;
}
