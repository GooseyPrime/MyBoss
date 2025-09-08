import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import type { AuditJson } from '../../../packages/shared/types/audit';

const DASHBOARD_TOKEN = process.env.DASHBOARD_TOKEN;

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ') || auth.split(' ')[1] !== DASHBOARD_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let data: AuditJson;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  await query('BEGIN');
  try {
    // Upsert project
    await query(
      `INSERT INTO projects (id, name, created_at) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [data.project.id, data.project.name, data.project.created_at]
    );
    // Upsert repos
    for (const repo of data.repos) {
      await query(
        `INSERT INTO repos (id, project_id, url, provider) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, provider = EXCLUDED.provider`,
        [repo.id, repo.project_id, repo.url, repo.provider]
      );
    }
    // Upsert audit_run
    await query(
      `INSERT INTO audit_runs (id, project_id, started_at, finished_at, status) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET finished_at = EXCLUDED.finished_at, status = EXCLUDED.status`,
      [data.audit_run.id, data.audit_run.project_id, data.audit_run.started_at, data.audit_run.finished_at, data.audit_run.status]
    );
    // Upsert findings
    for (const finding of data.findings) {
      await query(
        `INSERT INTO findings (id, audit_run_id, type, severity, message, file, line) VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET type = EXCLUDED.type, severity = EXCLUDED.severity, message = EXCLUDED.message, file = EXCLUDED.file, line = EXCLUDED.line`,
        [finding.id, finding.audit_run_id, finding.type, finding.severity, finding.message, finding.file, finding.line]
      );
    }
    // Upsert patch_plans
    for (const plan of data.patch_plans) {
      await query(
        `INSERT INTO patch_plans (id, finding_id, description, status) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description, status = EXCLUDED.status`,
        [plan.id, plan.finding_id, plan.description, plan.status]
      );
    }
    await query('COMMIT');
    return NextResponse.json({ ok: true });
  } catch (e) {
    await query('ROLLBACK');
    return NextResponse.json({ error: 'DB error', details: String(e) }, { status: 500 });
  }
}
