import { createServerDb } from "@/lib/db/server";
import { redis } from "@/lib/db/redis";
import {
  CACHE_TTL_SECONDS,
  METADATA_TTL_SECONDS,
  ensureUnderQuota,
  estimateBytes,
  heartbeat,
  recordChatSize,
  trackAccess,
  userPinnedKey,
} from "./quota";

/**
 * Warm up Redis with a user's recent chats/messages from Postgres at most once per day.
 * If perUserBudgetBytes is not supplied, it will be computed via heartbeat(userId).
 */
export async function warmUserCacheIfNeeded(
  userId: string,
  perUserBudgetBytes?: number,
): Promise<void> {
  try {
    const ONE_DAY_SECONDS = 24 * 60 * 60;
    const warmMarkerKey = `cache:v1:user:${userId}:warmed_at`;
    const warmLockKey = `cache:v1:user:${userId}:warm_lock`;

    // Skip if we already warmed within the last 24h
    const alreadyWarmed = await redis.get<string | null>(warmMarkerKey);
    if (alreadyWarmed) return;

    // Acquire a short lock to avoid duplicate concurrent warms
    const lockAcquired = await redis.set(warmLockKey, "1", { nx: true, ex: 30 });
    if (!lockAcquired) return;

    try {
      // Ensure we have a budget to enforce
      let budget = perUserBudgetBytes;
      if (typeof budget !== "number" || Number.isNaN(budget)) {
        const { perUserBudgetBytes: computed } = await heartbeat(userId);
        budget = computed;
      }

      const db = await createServerDb();
      // Get user's chats; will include pinned_at and updated_at
      const recentChats = await db.chats.getChats(userId);
      const WARM_CHATS_LIMIT = Math.max(1, Number(process.env.CACHE_WARM_CHATS_LIMIT || 8));

      // Refresh the user's pinned set in Redis (used by eviction prioritization)
      try {
        const pinnedIds = recentChats
          .filter((c: any) => Boolean(c?.pinned_at))
          .map((c: any) => String(c.id));
        const pkey = userPinnedKey(userId);
        const pipe = redis.pipeline();
        pipe.del(pkey);
        if (pinnedIds.length > 0) {
          // @ts-expect-error upstash types accept varargs
          pipe.sadd(pkey, ...pinnedIds);
        }
        pipe.expire(pkey, METADATA_TTL_SECONDS);
        await pipe.exec();
      } catch {}

      // Choose targets: pinned first (by pinned_at desc), then most recent unpinned (by updated_at desc)
      const pinned = [...recentChats]
        .filter((c: any) => Boolean(c?.pinned_at))
        .sort((a: any, b: any) => new Date(b.pinned_at).getTime() - new Date(a.pinned_at).getTime());
      const unpinned = [...recentChats]
        .filter((c: any) => !c?.pinned_at)
        .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      const targets = [...pinned, ...unpinned].slice(0, WARM_CHATS_LIMIT);

      if (targets.length > 0) {
        const toFetch = targets.map((chat) => ({
          chatId: chat.id as string,
          key: `cache:v1:messages:byChat:${chat.id as string}`,
        }));

        // Check which caches already exist
        const existence = await Promise.all(toFetch.map(({ key }) => redis.exists(key)));
        const missing = toFetch.filter((_, idx) => !existence[idx]);

        if (missing.length > 0) {
          // Fetch messages concurrently
          const messagesByChat: Record<string, any[]> = {};
          await Promise.all(
            missing.map(async ({ chatId }) => {
              messagesByChat[chatId] = await db.messages.getMessagesByChatId(chatId);
            }),
          );

          // Populate Redis and record accounting
          await Promise.all(
            missing.map(async ({ chatId, key }) => {
              const msgs = messagesByChat[chatId] || [];
              await redis.set(key, msgs, { ex: CACHE_TTL_SECONDS });
              try {
                const approxBytes = estimateBytes(msgs);
                await recordChatSize(userId, chatId, approxBytes);
                await trackAccess(userId, chatId);
              } catch {}
            }),
          );
        }

        // Track recency for ones that already existed
        await Promise.all(
          toFetch.map(async ({ chatId }, idx) => {
            if (existence[idx]) {
              await trackAccess(userId, chatId);
            }
          }),
        );
      }

      // Enforce per-user cache budget
      try {
        await ensureUnderQuota(userId, budget!);
      } catch {}

      // Mark as warmed for the next 24 hours
      await redis.set(warmMarkerKey, String(Date.now()), { ex: ONE_DAY_SECONDS });
    } finally {
      // Let the lock expire
    }
  } catch {}
}


