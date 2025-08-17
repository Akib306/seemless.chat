import { heartbeat, getUsedBytes, userPinnedKey } from "@/lib/cache/quota";
import { HEARTBEAT_TTL_SECONDS, CACHE_TTL_SECONDS } from "@/lib/cache/config";
import { warmUserCacheIfNeeded } from "@/lib/cache/warm";
import { redis } from "@/lib/db/redis";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	try {
		// Fast path: allow client to pass x-user-id for low-latency heartbeats
		const userIdHeader = request.headers.get("x-user-id");
		let userId: string | null = userIdHeader || null;
		// In production, require server auth to prevent spoofing; allow header in dev
		const isProd = process.env.NODE_ENV === "production";
		if (!userId || isProd) {
			const supabase = await createClient();
			const {
				data: { user },
				error,
			} = await supabase.auth.getUser();
			if (error || !user) {
				return new Response("unauthorized", { status: 401 });
			}
			userId = user.id;
		}

		const { activeUsers, perUserBudgetBytes } = await heartbeat(userId);

		// Dev-only: allow forcing a warm to test repeatedly
		let warmForced = false;
		try {
			const url = new URL(request.url);
			const force = url.searchParams.get("forceWarm");
			const isProdEnv = process.env.NODE_ENV === "production";
			if (force === "1" && !isProdEnv) {
				const warmMarkerKey = `cache:v1:user:${userId}:warmed_at`;
				await redis.del(warmMarkerKey);
				warmForced = true;
			}
		} catch {}

		// Opportunistic cache warm-up: once per 24h, prefill most recent chats
		await warmUserCacheIfNeeded(userId, perUserBudgetBytes);

		// Keep pinned chats resident by refreshing TTL if present in Redis
		try {
			const pkey = userPinnedKey(userId);
			const pinnedIds = await redis.smembers<string[]>(pkey);
			if (Array.isArray(pinnedIds) && pinnedIds.length > 0) {
				const pipe = redis.pipeline();
				for (const cid of pinnedIds) {
					pipe.expire(`cache:v1:messages:byChat:${cid}`, CACHE_TTL_SECONDS);
				}
				await pipe.exec();
			}
		} catch {}

		const usedBytes = await getUsedBytes(userId);
		return Response.json({
			ok: true,
			activeUsers,
			perUserBudgetBytes,
			usedBytes,
			ttlSeconds: HEARTBEAT_TTL_SECONDS,
			warmForced,
		});
	} catch (e) {
		return new Response("bad request", { status: 400 });
	}
}
