import { redis } from "@/lib/db/redis";
import { createClient } from "@/lib/supabase/server";
import {
	userRecencyKey,
	userSizesKey,
	userUsedBytesKey,
	userPinnedKey,
} from "@/lib/cache/quota";

export async function POST(req: Request) {
	try {
		const { keys } = (await req.json()) as { keys?: unknown };
		if (!Array.isArray(keys)) {
			return new Response("bad request", { status: 400 });
		}

		// Guard: only allow deleting message-by-chat cache keys
		const allowedPrefix = "cache:v1:messages:byChat:";
		const safeKeys = keys.filter(
			(k): k is string => typeof k === "string" && k.startsWith(allowedPrefix),
		);

		if (safeKeys.length === 0) {
			return Response.json({ ok: true, deleted: 0 });
		}

		// derive chatIds
		const chatIds = safeKeys.map((k) => k.slice(allowedPrefix.length));

		// user context
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return new Response("unauthorized", { status: 401 });

		// Fetch sizes to decrement used bytes
		const sizes = await Promise.all(
			chatIds.map((cid) =>
				redis.hget<string | null>(userSizesKey(user.id), cid),
			),
		);
		const sizeByChat: Record<string, number> = {};
		chatIds.forEach((cid, idx) => {
			const v = sizes?.[idx];
			sizeByChat[cid] = v ? Number(v) : 0;
		});

		// Delete cache entries and accounting keys
		const deleted = await redis.del(...safeKeys);
		await redis.hdel(userSizesKey(user.id), ...chatIds);
		await redis.zrem(userRecencyKey(user.id), ...chatIds);
		try {
			await redis.srem(userPinnedKey(user.id), ...chatIds);
		} catch {}

		// Update used bytes
		const usedStr = await redis.get<string | null>(userUsedBytesKey(user.id));
		const used = usedStr ? Number(usedStr) : 0;
		const freed = chatIds.reduce((sum, cid) => sum + (sizeByChat[cid] || 0), 0);
		await redis.set(
			userUsedBytesKey(user.id),
			String(Math.max(0, used - freed)),
		);

		return Response.json({ ok: true, deleted, freedBytes: freed });
	} catch (e) {
		return new Response("bad request", { status: 400 });
	}
}
