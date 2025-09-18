import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, server } from '@/lib/responses';

// GET /api/projects/[slug]
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug;
    const { searchParams } = new URL(req.url);
    const withFindings = searchParams.get('withFindings') === 'true';
    const findingsCursor = searchParams.get('findingsCursor');
    const findingsLimit = parseInt(searchParams.get('findingsLimit') || '20', 10);

    // Get project basics
    const project = await db.project.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        repos: {
          select: {
            id: true,
            fullName: true,
            audits: {
              orderBy: { startedAt: 'desc' },
              take: 1,
              select: {
                id: true,
                startedAt: true,
                status: true,
                findings: true,
                rawJson: true,
                patchPlans: true,
              },
            },
          },
        },
      },
    });
    if (!project) return badRequest('Project not found');

    // Find the latest audit across all repos
    let latestAudit = null;
    let latestRepo = null;
    for (const repo of project.repos) {
      if (repo.audits.length > 0) {
        if (!latestAudit || new Date(repo.audits[0].startedAt) > new Date(latestAudit.startedAt)) {
          latestAudit = repo.audits[0];
          latestRepo = repo;
        }
      }
    }

    // Section extraction from rawJson or fallback
    let sections: any = {};
    if (latestAudit && latestAudit.rawJson) {
      const raw = latestAudit.rawJson as any;
      for (const key of [
        'overview','build_run','env_map','ci','dev_only','data_layer','security','cost','patch_plan','forecast','compliance']) {
        if (raw[key]) sections[key] = raw[key];
      }
    } else if (latestAudit) {
      // Fallback: derive from rows (findings, patchPlans, etc.)
      sections = {
        findings: latestAudit.findings,
        patchPlans: latestAudit.patchPlans,
      };
    }

    // Paginate findings if requested
    let findings = undefined;
    let findingsNextCursor = null;
    if (withFindings && latestAudit) {
      const allFindings = latestAudit.findings;
      let startIdx = 0;
      if (findingsCursor) {
        startIdx = allFindings.findIndex(f => f.id === findingsCursor) + 1;
        if (startIdx < 0) startIdx = 0;
      }
      findings = allFindings.slice(startIdx, startIdx + findingsLimit);
      if (allFindings.length > startIdx + findingsLimit) {
        findingsNextCursor = findings[findings.length - 1]?.id || null;
      }
    }

    // Compose repo summaries
    const repos = project.repos.map(repo => {
      const audit = repo.audits[0];
      return {
        id: repo.id,
        fullName: repo.fullName,
        latestAudit: audit
          ? { id: audit.id, startedAt: audit.startedAt, status: audit.status }
          : null,
      };
    });

    return ok({
      id: project.id,
      name: project.name,
      slug: project.slug,
      repos,
      latestAudit: latestAudit
        ? { id: latestAudit.id, startedAt: latestAudit.startedAt, status: latestAudit.status }
        : null,
      sections,
      findings,
      findingsNextCursor,
    });
  } catch (e) {
    return server('Failed to fetch project details');
  }
}
