import { heartbeat, getUsedBytes, HEARTBEAT_TTL_SECONDS } from "@/lib/cache/quota";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    // Fast path: allow client to pass x-user-id for low-latency heartbeats
    const userIdHeader = request.headers.get("x-user-id");
    let userId: string | null = userIdHeader || null;
    // In production, require server auth to prevent spoofing; allow header in dev
    const isProd = process.env.NODE_ENV === "production";
    if (!userId || isProd) {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        return new Response("unauthorized", { status: 401 });
      }
      userId = user.id;
    }

    const { activeUsers, perUserBudgetBytes } = await heartbeat(userId);
    const usedBytes = await getUsedBytes(userId);
    return Response.json({
      ok: true,
      activeUsers,
      perUserBudgetBytes,
      usedBytes,
      ttlSeconds: HEARTBEAT_TTL_SECONDS,
    });
  } catch (e) {
    return new Response("bad request", { status: 400 });
  }
}


