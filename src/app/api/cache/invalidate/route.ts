import { redis } from "@/lib/db/redis";

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

    const deleted = await redis.del(...safeKeys);
    return Response.json({ ok: true, deleted });
  } catch (e) {
    return new Response("bad request", { status: 400 });
  }
}


