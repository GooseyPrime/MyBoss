import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const envs = [
    'NOTION_TOKEN',
    'NOTION_DATABASE_ID',
    'NOTION_PROJECTS_PAGE_ID',
    'NOTION_FINDINGS_PAGE_ID',
  ];
  for (const key of envs) {
    if (!process.env[key]) {
      return Response.json({ ok: false, reason: 'Notion env missing' });
    }
  }
  // TODO: Upsert latest projects + top findings to Notion, rate limit 1/min
  // For now, just return no-op
  return Response.json({ ok: true, synced: 0 });
}
