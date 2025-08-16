// Client-safe cache configuration (no Redis imports)
export const GLOBAL_CACHE_BUDGET_MB = Number(process.env.CACHE_BUDGET_MB || 200);
export const GLOBAL_CACHE_BUDGET_BYTES = Math.max(1, Math.floor(GLOBAL_CACHE_BUDGET_MB * 1024 * 1024));
export const HEARTBEAT_TTL_SECONDS = Number(process.env.CACHE_HEARTBEAT_TTL_S || 60);
export const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 3600);
export const METADATA_TTL_SECONDS = Math.max(CACHE_TTL_SECONDS * 2, CACHE_TTL_SECONDS + HEARTBEAT_TTL_SECONDS);
export const PER_USER_MAX_MB = Number(process.env.CACHE_PER_USER_MAX_MB || 3);
export const PER_USER_MAX_BYTES = Math.max(1, Math.floor(PER_USER_MAX_MB * 1024 * 1024));


