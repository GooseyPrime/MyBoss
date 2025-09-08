
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, server } from '@/lib/responses';
import { upsertNotionProjectsAndFindings } from '@/lib/notion';

// In-memory rate limit for Notion sync (1/min)
let lastSync = 0;

export async function POST(req: NextRequest) {
  const envs = [
    'NOTION_TOKEN',
    'NOTION_DATABASE_ID',
    'NOTION_PROJECTS_PAGE_ID',
    'NOTION_FINDINGS_PAGE_ID',
  ];
  for (const key of envs) {
    if (!process.env[key]) {
      return badRequest('Notion env missing');
    }
  }
  const now = Date.now();
  if (now - lastSync < 60_000) {
    return badRequest('Rate limit: 1 sync per minute');
  }
  lastSync = now;
  try {
    // Get latest projects and top findings
    const projects = await db.project.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });
    const findings = await db.finding.findMany({
      orderBy: { severity: 'desc' },
      take: 10,
    });
    const result = await upsertNotionProjectsAndFindings(projects, findings);
    return ok({ success: true, ...result });
  } catch (e) {
    return server('Notion sync failed: ' + String(e));
  }
}
