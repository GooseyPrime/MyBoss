import { NextRequest } from 'next/server';
import { requireBearer } from '../../../../lib/auth';
import { ok, badRequest, server } from '../../../../lib/responses';
import { AuditSchema } from '../../../../../../packages/shared/types/audit';
import { db } from '../../../../lib/db';
import { notifySlack } from '../../../../lib/slack';

export async function POST(req: NextRequest) {
  // Auth
  const auth = requireBearer(req);
  if (!auth.ok) return auth.res;

  // Parse and validate
  let data;
  try {
    data = await req.json();
  } catch {
    return badRequest('Invalid JSON');
  }
  const parsed = AuditSchema.safeParse(data);
  if (!parsed.success) return badRequest(parsed.error);
  const audit = parsed.data;

  try {
    // Upsert Project by slug
    const project = await db.project.upsert({
      where: { slug: audit.project.id },
      update: { name: audit.project.name },
      create: {
        slug: audit.project.id,
        name: audit.project.name,
        url: undefined,
      },
    });

    // Upsert Repos by fullName
    for (const repo of audit.repos) {
      await db.repo.upsert({
        where: { fullName: repo.id },
        update: { url: repo.url, provider: repo.provider, projectId: project.id },
        create: {
          fullName: repo.id,
          url: repo.url,
          provider: repo.provider,
          projectId: project.id,
        },
      });
    }

    // Upsert AuditRun by commitSha
    const auditRun = await db.auditRun.upsert({
      where: { commitSha: audit.audit_run.id },
      update: {
        status: audit.audit_run.status,
        startedAt: new Date(audit.audit_run.started_at),
        finishedAt: audit.audit_run.finished_at ? new Date(audit.audit_run.finished_at) : null,
      },
      create: {
        commitSha: audit.audit_run.id,
        status: audit.audit_run.status,
        startedAt: new Date(audit.audit_run.started_at),
        finishedAt: audit.audit_run.finished_at ? new Date(audit.audit_run.finished_at) : null,
        repoId: audit.repos[0]?.id, // assumes first repo is primary
      },
    });

    // Replace Findings and PatchPlans for this audit
    await db.finding.deleteMany({ where: { auditId: auditRun.id } });
    await db.patchPlan.deleteMany({ where: { auditId: auditRun.id } });
    for (const finding of audit.findings) {
      await db.finding.create({
        data: {
          auditId: auditRun.id,
          kind: finding.type,
          title: finding.message,
          severity: finding.severity,
          fileRefs: [finding.file],
          detail: {},
          createdAt: new Date(),
        },
      });
    }
    for (const plan of audit.patch_plans) {
      await db.patchPlan.create({
        data: {
          auditId: auditRun.id,
          rank: 1,
          why: plan.description,
          files: [],
          diff: '',
          rollback: '',
          createdAt: new Date(),
        },
      });
    }

    // Slack notification for high severity
    if (process.env.SLACK_WEBHOOK_URL) {
      const hasHigh = audit.findings.some(f => f.severity === 'high') ||
        (audit.findings.some(f => f.type === 'compliance' && f.severity === 'high'));
      if (hasHigh) {
        await notifySlack(`🚨 High severity finding in project ${project.name} (${audit.audit_run.id})`);
      }
    }

    return ok({ ok: true, audit_run_id: auditRun.id });
  } catch (e) {
    return server(e);
  }
}
