import { redis } from '@/lib/db/redis';

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const key = `health:${Date.now()}`;
  await redis.set(key, 'ok', { ex: 60 });
  const val = await redis.get<string>(key);
  return Response.json({ ok: val === 'ok' });
}

/* for health check run in a terminal window after running `npm run dev`
  $ curl -sS http://localhost:3000/api/health/redis

  it should return:
  $ {"ok":true}%
*/