#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import type { AuditJson } from '../packages/shared/types/audit';
import { startServer, waitForHealth } from './server-utils';

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

// Parse CLI arguments
function parseArgs(): { api?: string; token?: string; out?: string } {
    const args = process.argv.slice(2);
    const parsed: { api?: string; token?: string; out?: string } = {};
    
    for (const arg of args) {
        if (arg.startsWith('--api=')) {
            parsed.api = arg.split('=')[1].replace(/"/g, '');
        } else if (arg.startsWith('--token=')) {
            parsed.token = arg.split('=')[1].replace(/"/g, '');
        } else if (arg.startsWith('--out=')) {
            parsed.out = arg.split('=')[1].replace(/"/g, '');
        }
    }
    
    return parsed;
}

const cliArgs = parseArgs();

// Write audit.json (support CLI --out argument)
const outPath = path.join(__dirname, '../', cliArgs.out || 'audit.json');
fs.writeFileSync(outPath, JSON.stringify(audit, null, 2));
console.log(`Wrote ${cliArgs.out || 'audit.json'}`);

// POST to /api/ingest
(async () => {
    // Support both CLI arguments and environment variables
    const DASHBOARD_TOKEN = cliArgs.token || process.env.DASHBOARD_TOKEN || 'devtoken';
    const url = cliArgs.api || process.env.INGEST_URL || 'http://localhost:3000/api/ingest';
    
    let serverStop: (() => void) | null = null;
    let startedServer = false;
    
    try {
        // Check if we need to start a local server
        const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
        
        if (isLocalhost) {
            console.log('🔧 Local environment detected, ensuring server is available...');
            
            // Start the server (or detect if already running)
            const { stop, wasAlreadyRunning } = await startServer(DASHBOARD_TOKEN);
            serverStop = stop;
            startedServer = !wasAlreadyRunning;
            
            // Wait for server to be healthy (if we started it)
            if (!wasAlreadyRunning) {
                const healthy = await waitForHealth();
                if (!healthy) {
                    throw new Error('Server failed to become healthy');
                }
            }
        }
        
        // Now make the API request
        console.log(`📤 Posting audit data to ${url}`);
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
        
        if (!res.ok) {
            throw new Error(`Ingest failed with status ${res.status}: ${body}`);
        }
        
        console.log('✅ Audit data successfully ingested');
        
    } catch (error) {
        console.error('❌ Audit ingestion failed:', error);
        process.exit(1);
    } finally {
        // Only stop the server if we started it
        if (serverStop && startedServer) {
            console.log('🧹 Cleaning up server...');
            serverStop();
        } else if (serverStop) {
            // Just call the no-op stop function
            serverStop();
        }
    }
})();
