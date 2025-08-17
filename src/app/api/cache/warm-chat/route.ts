import { createClient } from "@/lib/supabase/server";
import { createServerDb } from "@/lib/db/server";
import { redis } from "@/lib/db/redis";
import { CACHE_TTL_SECONDS, METADATA_TTL_SECONDS } from "@/lib/cache/config";
import {
	estimateBytes,
	heartbeat,
	ensureUnderQuota,
	recordChatSize,
	trackAccess,
	userPinnedKey,
} from "@/lib/cache/quota";

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const chatId = url.searchParams.get("chatId");
		if (!chatId) return new Response("bad request", { status: 400 });

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return new Response("unauthorized", { status: 401 });

		const cacheKey = `cache:v1:messages:byChat:${chatId}`;

		const exists = await redis.exists(cacheKey);
		if (exists) {
			// Refresh TTL and track recency when already cached
			try {
				await redis.expire(cacheKey, CACHE_TTL_SECONDS);
				await trackAccess(user.id, chatId);
			} catch {}
			return Response.json({ ok: true, warmed: false, existed: true });
		}

		// Fetch messages under RLS; will only return for the authenticated user's chat
		const db = await createServerDb();
		const messages = await db.messages.getMessagesByChatId(chatId);

		const approxBytes = estimateBytes(messages);
		const [{ perUserBudgetBytes }] = await Promise.all([
			heartbeat(user.id),
			(async () => {
				await redis.set(cacheKey, messages, { ex: CACHE_TTL_SECONDS });
			})(),
			recordChatSize(user.id, chatId, approxBytes),
			trackAccess(user.id, chatId),
		]);

		// Best-effort: if this chat is pinned in Postgres, reflect that in Redis set
		try {
			const chat = await db.chats.getChat(chatId);
			const pkey = userPinnedKey(user.id);
			if ((chat as any)?.pinned_at) {
				await redis.sadd(pkey, chatId);
			} else {
				await redis.srem(pkey, chatId);
			}
			await redis.expire(pkey, METADATA_TTL_SECONDS);
		} catch {}

		// Enforce per-user budget after warming
		try {
			await ensureUnderQuota(user.id, perUserBudgetBytes);
		} catch {}

		return Response.json({
			ok: true,
			warmed: true,
			size: messages.length,
			bytes: approxBytes,
		});
	} catch {
		return new Response("bad request", { status: 400 });
	}
}
