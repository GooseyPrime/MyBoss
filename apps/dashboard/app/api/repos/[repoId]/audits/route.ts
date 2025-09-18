import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, server } from '@/lib/responses';

// GET /api/repos/[repoId]/audits?cursor=&limit=
export async function GET(req: NextRequest, { params }: { params: { repoId: string } }) {
  try {
    const repoId = params.repoId;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Paginated audits for repo
    const audits = await db.auditRun.findMany({
      where: { repoId },
      orderBy: { startedAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true,
        commitSha: true,
        status: true,
        startedAt: true,
        findings: { select: { severity: true } },
      },
    });
    const hasNext = audits.length > limit;
    const items = hasNext ? audits.slice(0, limit) : audits;
    const result = items.map(audit => {
      const findingCounts = { high: 0, medium: 0, low: 0 };
      for (const f of audit.findings) {
        if (f.severity === 'high') findingCounts.high++;
        else if (f.severity === 'medium') findingCounts.medium++;
        else if (f.severity === 'low') findingCounts.low++;
      }
      return {
        id: audit.id,
        commitSha: audit.commitSha,
        status: audit.status,
        startedAt: audit.startedAt,
        findingCounts,
      };
    });
    return ok({
      audits: result,
      nextCursor: hasNext ? items[items.length - 1].id : null,
    });
  } catch {
    return server('Failed to fetch audits');
  }
}
