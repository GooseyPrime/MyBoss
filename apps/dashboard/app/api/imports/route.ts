
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate';
import { ok, badRequest, server } from '@/lib/responses';
import unzipper from 'unzipper';

interface RawMessage {
  author?: string;
  user?: string;
  name?: string;
  role?: string;
  type?: string;
  content?: string;
  text?: string;
  message?: string;
  ts?: string | number;
  [key: string]: string | number | boolean | null | undefined;
}

interface RawThread {
  title?: string;
  thread_title?: string;
  messages?: RawMessage[];
  [key: string]: string | number | boolean | null | undefined | RawMessage[];
}

function parseProvider(provider: string | null): string | null {
  if (!provider) return null;
  provider = provider.toLowerCase();
  if (["chatgpt","claude","gemini","copilot"].includes(provider)) return provider;
  return null;
}

async function parseMultipart(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.startsWith('multipart/form-data')) return null;
  const formData = await req.formData();
  const provider = parseProvider(formData.get('provider') as string);
  const file = formData.get('file');
  return { provider, file };
}

async function extractJsonFromZip(file: File): Promise<unknown[]> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const zip = await unzipper.Open.buffer(buffer);
  const jsons: unknown[] = [];
  for (const entry of zip.files) {
    if (entry.path.endsWith('.json')) {
      const content = await entry.buffer();
      try {
        jsons.push(JSON.parse(content.toString()));
      } catch {}
    }
  }
  return jsons;
}

async function normalizeAndStore(provider: string, data: unknown[]): Promise<{threads: number, messages: number}> {
  let threads = 0, messages = 0;
  for (const raw of data) {
    // Normalize: expect {thread, messages[]} or array of messages
    const threadData = raw as RawThread;
    const threadTitle = threadData.title || threadData.thread_title || null;
    const msgs = Array.isArray(threadData.messages) ? threadData.messages : Array.isArray(raw) ? raw as RawMessage[] : [];
    if (!msgs.length) continue;
    await db.thread.create({
      data: {
        provider,
        title: threadTitle,
        messages: {
          create: msgs.map((m: RawMessage) => ({
            author: m.author || m.user || m.name || 'unknown',
            role: m.role || m.type || 'user',
            content: m.content || m.text || m.message || '',
            ts: m.ts ? new Date(m.ts) : new Date(),
            meta: JSON.parse(JSON.stringify(m)), // Convert to JSON serializable
          })),
        },
      },
    });
    threads++;
    messages += msgs.length;
  }
  return { threads, messages };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'local';
  if (checkRateLimit(ip)) {
    return new Response('Too Many Requests', { status: 429 });
  }
  try {
    const parsed = await parseMultipart(req);
    if (!parsed || !parsed.provider || !parsed.file) {
      return badRequest('Missing provider or file');
    }
    let datas: unknown[] = [];
    if ((parsed.file as File).name.endsWith('.zip')) {
      datas = await extractJsonFromZip(parsed.file as File);
    } else if ((parsed.file as File).name.endsWith('.json')) {
      const text = await (parsed.file as File).text();
      datas = [JSON.parse(text)];
    } else {
      return badRequest('File must be .zip or .json');
    }
    const { threads, messages } = await normalizeAndStore(parsed.provider, datas);
    return ok({ ok: true, imported: messages, threads });
  } catch (e) {
    return server('Import failed: ' + String(e));
  }
}
