import { redis } from "@/lib/db/redis";
import { createClient } from "@/lib/supabase/server";
import { estimateBytes, heartbeat, recordChatSize, ensureUnderQuota, trackAccess } from "@/lib/cache/quota";

type AppendItem = Record<string, unknown>;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      key?: unknown;
      append?: unknown;
      ex?: unknown;
    };

    const key = typeof body.key === "string" ? body.key : null;
    const append = Array.isArray(body.append) ? (body.append as AppendItem[]) : null;
    const ex = typeof body.ex === "number" ? body.ex : 300;

    if (!key || !append) return new Response("bad request", { status: 400 });

    // Guard: only allow updating message-by-chat keys
    const allowedPrefix = "cache:v1:messages:byChat:";
    if (!key.startsWith(allowedPrefix)) return new Response("forbidden", { status: 403 });

    // Identify chatId from key
    const chatId = key.slice(allowedPrefix.length);

    // Ensure user context
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("unauthorized", { status: 401 });

    // Read existing value
    const existing = await redis.get<AppendItem[]>(key);
    const next = Array.isArray(existing) ? [...existing, ...append] : [...append];

    // In parallel: write cache, update accounting, and track heartbeat/access
    const newSizeBytes = estimateBytes(next);
    const [{ perUserBudgetBytes }] = await Promise.all([
      heartbeat(user.id),
      (async () => {
        await redis.set(key, next, { ex });
      })(),
      recordChatSize(user.id, chatId, newSizeBytes),
      trackAccess(user.id, chatId),
    ]);

    // Evict if needed after updates
    const { evicted } = await ensureUnderQuota(user.id, perUserBudgetBytes);

    return Response.json({ ok: true, size: next.length, perUserBudgetBytes, evicted });
  } catch {
    return new Response("bad request", { status: 400 });
  }
}


