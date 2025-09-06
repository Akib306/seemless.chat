import ChatClientServer from "@/components/chat-client-server";
import { createServerDb } from "@/lib/db/server";
import { redis } from "@/lib/db/redis";
import {
	estimateBytes,
	recordChatSize,
	heartbeat,
	ensureUnderQuota,
} from "@/lib/cache/quota";
import { CACHE_TTL_SECONDS } from "@/lib/cache/config";
import { createClient } from "@/lib/supabase/server";
import { type Message } from "@/types/db";
import { AppUIMessage } from "@/types/ui";
import { convertToUIMessage, mapDbPartsToUiParts } from "@/lib/utils/message-mapper";
// SSR: keep minimal

export default async function ChatPage({
	params,
}: {
	params: Promise<{ chatid: string }>;
}) {
	const { chatid } = await params;
	const cacheKey = `cache:v1:messages:byChat:${chatid}`;
	const cached = await redis.get<any[]>(cacheKey);

	const db = await createServerDb();

	let initialMessages = cached as any[] | null;

	if (!initialMessages) {
		initialMessages = await db.messages.getMessagesByChatId(chatid);
	}

	const uiMessages: AppUIMessage[] = await Promise.all(initialMessages.map(async (msg: Message) => {
		const parts = await db.messageParts.getPartsByMessageId(msg.id);
		return convertToUIMessage(msg, parts);
	}));

	if (!cached) {
		try {
			const supabase = await createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			const approxBytes = estimateBytes(initialMessages);
			await Promise.all([
				(async () => {
					await redis.set(cacheKey, initialMessages, { ex: CACHE_TTL_SECONDS });
				})(),
				(async () => {
					if (user) await recordChatSize(user.id, chatid, approxBytes);
				})(),
				(async () => {
					if (user) {
						const { perUserBudgetBytes } = await heartbeat(user.id);
						await ensureUnderQuota(user.id, perUserBudgetBytes);
					}
				})(),
			]);
		} catch {}
	}
	return <ChatClientServer chatId={chatid} initialMessages={uiMessages} />;
}
