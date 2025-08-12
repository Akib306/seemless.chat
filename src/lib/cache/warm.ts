import { createServerDb } from "@/lib/db/server";
import { redis } from "@/lib/db/redis";
import {
  CACHE_TTL_SECONDS,
  ensureUnderQuota,
  estimateBytes,
  heartbeat,
  recordChatSize,
  trackAccess,
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
      // Get most recent chats from the last session (ordered by updated_at desc)
      const recentChats = await db.chats.getChats(userId);
      const WARM_CHATS_LIMIT = Math.max(1, Number(process.env.CACHE_WARM_CHATS_LIMIT || 8));
      const targets = recentChats.slice(0, WARM_CHATS_LIMIT);

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


