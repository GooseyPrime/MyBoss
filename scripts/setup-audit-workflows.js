#!/usr/bin/env node
// Usage: node scripts/setup-audit-workflows.js
// Prompts for GitHub PAT and dashboard token, then sets up audit workflow and secrets in all GooseyPrime repos (except dashboard)

const readline = require('readline');
const fetch = require('node-fetch');
const { execSync } = require('child_process');

const WORKFLOW_CONTENT = `name: audit
on:
  push:
    branches: [ main ]
  schedule:
    - cron: '37 3 * * *'
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm i -g pnpm@9
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec tsx scripts/run-audit.ts --api=\"$DASHBOARD_API\" --token=\"$DASHBOARD_TOKEN\" --out=audit.json
      - uses: actions/upload-artifact@v4
        with:
          name: audit.json
          path: audit.json
`;

const OWNER = 'GooseyPrime';
const DASHBOARD_API = 'https://myboss.up.railway.app/api/ingest';

function prompt(query) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
}

async function main() {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN || await prompt('GitHub PAT (repo/workflow scopes): ');
    const DASHBOARD_TOKEN = process.env.DASHBOARD_TOKEN || await prompt('Dashboard token: ');

    const headers = { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' };
    // 1. List all repos
    const reposRes = await fetch(`https://api.github.com/orgs/${OWNER}/repos?per_page=100`, { headers });
    const repos = await reposRes.json();
    for (const repo of repos) {
        if (repo.name.includes('dashboard')) continue;
        console.log(`\n--- Setting up: ${repo.name}`);
        // 2. Create/Update workflow file
        const path = '.github/workflows/audit.yml';
        const contentB64 = Buffer.from(WORKFLOW_CONTENT).toString('base64');
        // Get SHA if file exists
        let sha = undefined;
        const fileRes = await fetch(`https://api.github.com/repos/${OWNER}/${repo.name}/contents/${encodeURIComponent(path)}`, { headers });
        if (fileRes.status === 200) {
            const fileJson = await fileRes.json();
            sha = fileJson.sha;
        }
        // PUT file
        await fetch(`https://api.github.com/repos/${OWNER}/${repo.name}/contents/${encodeURIComponent(path)}`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'ci: add audit workflow',
                content: contentB64,
                sha,
                branch: repo.default_branch,
            }),
        });
        // 3. Set secrets securely
        // Get repo public key
        const pkRes = await fetch(`https://api.github.com/repos/${OWNER}/${repo.name}/actions/secrets/public-key`, { headers });
        if (pkRes.status !== 200) {
            console.error(`Failed to get public key for ${repo.name}`);
            continue;
        }
        const pkJson = await pkRes.json();
        for (const [key, value] of [
            ['DASHBOARD_API', DASHBOARD_API],
            ['DASHBOARD_TOKEN', DASHBOARD_TOKEN],
        ]) {
            // Encrypt secret using tweetsodium
            const encrypted = execSync(`node ./scripts/gh-encrypt.js ${pkJson.key} "${value}"`).toString().trim();
            await fetch(`https://api.github.com/repos/${OWNER}/${repo.name}/actions/secrets/${key}`, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encrypted_value: encrypted,
                    key_id: pkJson.key_id,
                }),
            });
            console.log(`Set secret ${key}`);
        }
        console.log(`Workflow and secrets set for ${repo.name}`);
    }
    console.log('\nAll repos processed.');
}

main().catch(e => { console.error(e); process.exit(1); });
