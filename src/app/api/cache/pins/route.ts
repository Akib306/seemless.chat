import { redis } from "@/lib/db/redis";
import { createClient } from "@/lib/supabase/server";
import { userPinnedKey } from "@/lib/cache/quota";
import { CACHE_TTL_SECONDS, METADATA_TTL_SECONDS } from "@/lib/cache/config";

export async function POST(req: Request) {
	try {
		const { chatId, pinned } = (await req.json()) as {
			chatId?: unknown;
			pinned?: unknown;
		};
		if (typeof chatId !== "string" || typeof pinned !== "boolean") {
			return new Response("bad request", { status: 400 });
		}

		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return new Response("unauthorized", { status: 401 });

		const pkey = userPinnedKey(user.id);
		if (pinned) {
			await redis.sadd(pkey, chatId);
			await redis.expire(pkey, METADATA_TTL_SECONDS);
			// Nudge the messages cache TTL if present to reduce risk of expiry shortly after pin
			try {
				const cacheKey = `cache:v1:messages:byChat:${chatId}`;
				await redis.expire(cacheKey, CACHE_TTL_SECONDS);
			} catch {}
		} else {
			await redis.srem(pkey, chatId);
			await redis.expire(pkey, METADATA_TTL_SECONDS);
		}

		return Response.json({ ok: true });
	} catch (e) {
		return new Response("bad request", { status: 400 });
	}
}
