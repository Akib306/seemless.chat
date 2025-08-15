import { redis } from "@/lib/db/redis";

// Global cache configuration
export const GLOBAL_CACHE_BUDGET_MB = Number(process.env.CACHE_BUDGET_MB || 200);
export const GLOBAL_CACHE_BUDGET_BYTES = Math.max(1, Math.floor(GLOBAL_CACHE_BUDGET_MB * 1024 * 1024));
export const HEARTBEAT_TTL_SECONDS = Number(process.env.CACHE_HEARTBEAT_TTL_S || 60);
export const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 3600);
export const METADATA_TTL_SECONDS = Math.max(CACHE_TTL_SECONDS * 2, CACHE_TTL_SECONDS + HEARTBEAT_TTL_SECONDS);
// Hard cap per-user budget (in MB). Each user gets at most this many bytes.
export const PER_USER_MAX_MB = Number(process.env.CACHE_PER_USER_MAX_MB || 3);
export const PER_USER_MAX_BYTES = Math.max(1, Math.floor(PER_USER_MAX_MB * 1024 * 1024));

// Redis key helpers
export const activeUsersKey = "cache:v1:active_users"; // ZSET: member=userId, score=lastSeenMillis
export const userRecencyKey = (userId: string) => `cache:v1:user:${userId}:recency`; // ZSET: member=chatId, score=lastAccessMillis
export const userSizesKey = (userId: string) => `cache:v1:user:${userId}:sizes`; // HASH: field=chatId, value=bytes (stringified int)
export const userUsedBytesKey = (userId: string) => `cache:v1:user:${userId}:used_bytes`; // STRING: int bytes
// SET of pinned chatIds for a user; membership used to prefer keeping pinned in cache
export const userPinnedKey = (userId: string) => `cache:v1:user:${userId}:pinned`;

export function getPerUserBudgetBytes(activeUsersCount: number): number {
  const divisor = Math.max(1, activeUsersCount);
  // Baseline share of global budget
  const share = Math.floor(GLOBAL_CACHE_BUDGET_BYTES / divisor);
  // Enforce per-user hard cap, and a small minimum floor
  return Math.max(64 * 1024, Math.min(share, PER_USER_MAX_BYTES));
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
  const pinnedKey = userPinnedKey(userId);

  let used = await getUsedBytes(userId);
  const evicted: Array<{ chatId: string; bytes: number }> = [];

  // Snapshot pinned set to avoid N round-trips during eviction loop
  let pinnedSet: Set<string> = new Set();
  try {
    const pinnedMembers = await redis.smembers<string[]>(pinnedKey);
    if (Array.isArray(pinnedMembers)) pinnedSet = new Set(pinnedMembers);
  } catch {}

  // Evict least-recently-used chats until under budget.
  // Prefer evicting UNPINNED chats; only evict pinned when no unpinned remain.
  let safety = 1000; // prevent infinite loops
  while (used > budgetBytes && safety-- > 0) {
    // Fetch a small batch of the oldest chats to find the first UNPINNED candidate
    const candidates = await redis.zrange<string[]>(recencyKey, 0, 50);
    if (!Array.isArray(candidates) || candidates.length === 0) break;

    // Determine first unpinned candidate; if none, fall back to the absolute LRU (which may be pinned)
    let victimChatId: string | null = null;
    for (const candidate of candidates) {
      if (!pinnedSet.has(candidate)) { victimChatId = candidate; break; }
    }
    if (!victimChatId) {
      victimChatId = candidates[0];
    }

    const sizeStr = await redis.hget<string | null>(sizesKey, victimChatId);
    const bytes = sizeStr ? Number(sizeStr) : 0;

    // Check if message key exists; if missing, still reclaim recorded size
    const messageKey = `cache:v1:messages:byChat:${victimChatId}`;
    const pipe = redis.pipeline();
    pipe.del(messageKey);
    pipe.hdel(sizesKey, victimChatId);
    pipe.zrem(recencyKey, victimChatId);
    pipe.decrby(usedKey, Math.trunc(bytes));
    pipe.expire(sizesKey, METADATA_TTL_SECONDS);
    pipe.expire(recencyKey, METADATA_TTL_SECONDS);
    pipe.expire(usedKey, METADATA_TTL_SECONDS);
    await pipe.exec();

    used = Math.max(0, used - bytes);
    evicted.push({ chatId: victimChatId, bytes });
  }

  return { evicted };
}


