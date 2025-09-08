import { db } from '@/lib/db';
import { ok } from '@/lib/responses';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return ok({ ok: true, db: true });
  } catch {
    return Response.json({ ok: false });
  }
}
