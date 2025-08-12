import { redis } from "@/lib/db/redis";

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

    // Read existing value
    const existing = await redis.get<AppendItem[]>(key);
    const next = Array.isArray(existing) ? [...existing, ...append] : [...append];

    await redis.set(key, next, { ex });
    return Response.json({ ok: true, size: next.length });
  } catch {
    return new Response("bad request", { status: 400 });
  }
}


