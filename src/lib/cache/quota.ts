import { redis } from "@/lib/db/redis";

// Global cache configuration
export const GLOBAL_CACHE_BUDGET_MB = Number(process.env.CACHE_BUDGET_MB || 200);
export const GLOBAL_CACHE_BUDGET_BYTES = Math.max(1, Math.floor(GLOBAL_CACHE_BUDGET_MB * 1024 * 1024));
export const HEARTBEAT_TTL_SECONDS = Number(process.env.CACHE_HEARTBEAT_TTL_S || 60);
export const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 3600);
export const METADATA_TTL_SECONDS = Math.max(CACHE_TTL_SECONDS * 2, CACHE_TTL_SECONDS + HEARTBEAT_TTL_SECONDS);

// Redis key helpers
export const activeUsersKey = "cache:v1:active_users"; // ZSET: member=userId, score=lastSeenMillis
export const userRecencyKey = (userId: string) => `cache:v1:user:${userId}:recency`; // ZSET: member=chatId, score=lastAccessMillis
export const userSizesKey = (userId: string) => `cache:v1:user:${userId}:sizes`; // HASH: field=chatId, value=bytes (stringified int)
export const userUsedBytesKey = (userId: string) => `cache:v1:user:${userId}:used_bytes`; // STRING: int bytes

export function getPerUserBudgetBytes(activeUsersCount: number): number {
  const divisor = Math.max(1, activeUsersCount);
  // Use the full configured budget; caller can pick a lower GLOBAL_CACHE_BUDGET_MB if needed
  return Math.max(64 * 1024, Math.floor(GLOBAL_CACHE_BUDGET_BYTES / divisor)); // minimum 64 KB per active user
}

export async function heartbeat(userId: string): Promise<{ activeUsers: number; perUserBudgetBytes: number }> {
  const now = Date.now();
  const cutoff = now - HEARTBEAT_TTL_SECONDS * 1000;

  const pipeline = redis.pipeline();
  pipeline.zadd(activeUsersKey, { score: now, member: userId });
  pipeline.zremrangebyscore(activeUsersKey, 0, cutoff);
  pipeline.zcard(activeUsersKey);
  const [, , card] = await pipeline.exec<[unknown, unknown, number]>();

  const activeUsers = Math.max(1, Number(card ?? 1));
  const perUserBudgetBytes = getPerUserBudgetBytes(activeUsers);
  return { activeUsers, perUserBudgetBytes };
}

export function estimateBytes(value: unknown): number {
  try {
    if (typeof value === "string") return new TextEncoder().encode(value).length;
    const str = JSON.stringify(value);
    return new TextEncoder().encode(str).length;
  } catch {
    // Fallback to conservative estimate
    return 1024;
  }
}

export async function trackAccess(userId: string, chatId: string): Promise<void> {
  const key = userRecencyKey(userId);
  const pipe = redis.pipeline();
  pipe.zadd(key, { score: Date.now(), member: chatId });
  pipe.expire(key, METADATA_TTL_SECONDS);
  await pipe.exec();
}

export async function recordChatSize(userId: string, chatId: string, newSizeBytes: number, previousSizeBytes?: number): Promise<number> {
  const sizesKey = userSizesKey(userId);
  const usedKey = userUsedBytesKey(userId);

  // Determine prior size in one round-trip
  let prior = previousSizeBytes;
  if (typeof prior !== "number") {
    const priorStr = await redis.hget<string | null>(sizesKey, chatId);
    prior = priorStr ? Number(priorStr) : 0;
  }
  const delta = Math.max(-prior, newSizeBytes - (prior || 0));

  // Update size map and increment used bytes atomically-ish
  const pipe = redis.pipeline();
  pipe.hset(sizesKey, { [chatId]: String(newSizeBytes) });
  // incrby expects integer; ensure bounds and integer
  pipe.incrby(userUsedBytesKey(userId), Math.trunc(delta));
  pipe.expire(sizesKey, METADATA_TTL_SECONDS);
  pipe.expire(usedKey, METADATA_TTL_SECONDS);
  await pipe.exec();
  return delta;
}

export async function getUsedBytes(userId: string): Promise<number> {
  const usedKey = userUsedBytesKey(userId);
  const s = await redis.get<string | null>(usedKey);
  return s ? Number(s) : 0;
}

export async function ensureUnderQuota(userId: string, budgetBytes: number): Promise<{ evicted: Array<{ chatId: string; bytes: number }> }> {
  const recencyKey = userRecencyKey(userId);
  const sizesKey = userSizesKey(userId);
  const usedKey = userUsedBytesKey(userId);

  let used = await getUsedBytes(userId);
  const evicted: Array<{ chatId: string; bytes: number }> = [];

  // Evict least-recently-used chats until under budget
  let safety = 1000; // prevent infinite loops
  while (used > budgetBytes && safety-- > 0) {
    const lru = await redis.zrange<string[]>(recencyKey, 0, 0);
    const lruChatId = Array.isArray(lru) && lru.length > 0 ? lru[0] : null;
    if (!lruChatId) break;

    const sizeStr = await redis.hget<string | null>(sizesKey, lruChatId);
    const bytes = sizeStr ? Number(sizeStr) : 0;

    // Check if message key exists; if missing, still reclaim recorded size
    const messageKey = `cache:v1:messages:byChat:${lruChatId}`;
    const pipe = redis.pipeline();
    pipe.del(messageKey);
    pipe.hdel(sizesKey, lruChatId);
    pipe.zrem(recencyKey, lruChatId);
    pipe.decrby(usedKey, Math.trunc(bytes));
    pipe.expire(sizesKey, METADATA_TTL_SECONDS);
    pipe.expire(recencyKey, METADATA_TTL_SECONDS);
    pipe.expire(usedKey, METADATA_TTL_SECONDS);
    await pipe.exec();

    used = Math.max(0, used - bytes);
    evicted.push({ chatId: lruChatId, bytes });
  }

  return { evicted };
}


