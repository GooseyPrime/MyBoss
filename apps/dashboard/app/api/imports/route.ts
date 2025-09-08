import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rate';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'local';
  if (checkRateLimit(ip)) {
    return new Response('Too Many Requests', { status: 429 });
  }
  // Accept multipart/form-data (zip/json), provider = chatgpt|claude|gemini|copilot
  // TODO: Parse, normalize to messages/threads, index text, return summary
  return Response.json({ ok: true, imported: 0, threads: 0 });
}
