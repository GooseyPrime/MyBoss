import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { ok, badRequest, server } from '@/lib/responses';

// GET /api/audits/[auditId]
export async function GET(req: NextRequest, { params }: { params: { auditId: string } }) {
  try {
    const auditId = params.auditId;
    const { searchParams } = new URL(req.url);
    const findingsCursor = searchParams.get('findingsCursor');
    const findingsLimit = parseInt(searchParams.get('findingsLimit') || '20', 10);

    // Get auditRun with findings and patchPlans
    const audit = await db.auditRun.findUnique({
      where: { id: auditId },
      include: {
        findings: true,
        patchPlans: true,
      },
    });
    if (!audit) return badRequest('Audit not found');

    // Paginate findings
    let findings = audit.findings;
    let findingsNextCursor = null;
    if (findingsCursor) {
      const idx = findings.findIndex(f => f.id === findingsCursor) + 1;
      findings = findings.slice(idx, idx + findingsLimit);
      if (audit.findings.length > idx + findingsLimit) {
        findingsNextCursor = findings[findings.length - 1]?.id || null;
      }
    } else {
      findings = findings.slice(0, findingsLimit);
      if (audit.findings.length > findingsLimit) {
        findingsNextCursor = findings[findings.length - 1]?.id || null;
      }
    }

    return ok({
      ...audit,
      findings,
      findingsNextCursor,
      patchPlans: audit.patchPlans,
      rawJson: audit.rawJson || undefined,
    });
  } catch (e) {
    return server('Failed to fetch audit');
  }
}
