import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, server } from '@/lib/responses';

// GET /api/projects?cursor=&limit=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Fetch projects with pagination
    const projects = await db.project.findMany({
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        repos: {
          select: {
            audits: {
              orderBy: { startedAt: 'desc' },
              take: 1,
              select: {
                id: true,
                startedAt: true,
                status: true,
                findings: {
                  select: { severity: true },
                },
              },
            },
          },
        },
      },
    });

    const hasNext = projects.length > limit;
    const items = hasNext ? projects.slice(0, limit) : projects;

    const result = items.map((project) => {
      // Find the latest audit across all repos
      let latestAudit = null;
      for (const repo of project.repos) {
        if (repo.audits.length > 0) {
          if (!latestAudit || new Date(repo.audits[0].startedAt) > new Date(latestAudit.startedAt)) {
            latestAudit = repo.audits[0];
          }
        }
      }
      // Aggregate severity counts
      const severityCounts = { high: 0, medium: 0, low: 0 };
      if (latestAudit) {
        for (const finding of latestAudit.findings) {
          if (finding.severity === 'high') severityCounts.high++;
          else if (finding.severity === 'medium') severityCounts.medium++;
          else if (finding.severity === 'low') severityCounts.low++;
        }
      }
      return {
        id: project.id,
        name: project.name,
        slug: project.slug,
        latestAudit: latestAudit
          ? { id: latestAudit.id, startedAt: latestAudit.startedAt, status: latestAudit.status }
          : null,
        severityCounts,
      };
    });

    return ok({
      projects: result,
      nextCursor: hasNext ? items[items.length - 1].id : null,
    });
  } catch {
    return server('Failed to fetch projects');
  }
}
