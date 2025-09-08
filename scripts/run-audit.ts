#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import type { AuditJson } from '../packages/shared/types/audit';

// Simulate an audit.json
const audit: AuditJson = {
    project: {
        id: 'demo-project',
        name: 'Demo Project',
        created_at: new Date().toISOString(),
    },
    repos: [
        {
            id: 'repo-1',
            project_id: 'demo-project',
            url: 'https://github.com/example/repo',
            provider: 'github',
        },
    ],
    audit_run: {
        id: uuidv4(),
        project_id: 'demo-project',
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        status: 'success',
    },
    findings: [
        {
            id: uuidv4(),
            audit_run_id: '', // will fill below
            type: 'vuln',
            severity: 'low',
            message: 'Example finding',
            file: 'src/index.ts',
            line: 42,
        },
    ],
    patch_plans: [
        {
            id: uuidv4(),
            finding_id: '', // will fill below
            description: 'Apply patch',
            status: 'open',
        },
    ],
};

audit.findings[0].audit_run_id = audit.audit_run.id;
audit.patch_plans[0].finding_id = audit.findings[0].id;

const outPath = path.join(__dirname, '../audit.json');
fs.writeFileSync(outPath, JSON.stringify(audit, null, 2));
console.log('Wrote audit.json');

// POST to /api/ingest
(async () => {
    const DASHBOARD_TOKEN = process.env.DASHBOARD_TOKEN || 'devtoken';
    const url = process.env.INGEST_URL || 'http://localhost:3000/api/ingest';
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DASHBOARD_TOKEN}`,
        },
        body: JSON.stringify(audit),
    });
    const body = await res.text();
    console.log('Ingest response:', res.status, body);
})();
