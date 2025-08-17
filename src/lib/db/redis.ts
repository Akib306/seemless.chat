import { Redis } from "@upstash/redis";

const redisUrl =
	process.env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_URL;
const redisToken =
	process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_TOKEN;

export const redis =
	redisUrl && redisToken
		? new Redis({ url: redisUrl, token: redisToken })
		: Redis.fromEnv();
