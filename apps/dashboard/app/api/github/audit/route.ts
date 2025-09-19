import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { execSync } from 'child_process';

const WORKFLOW_CONTENT = `name: audit
on:
  push:
    branches: [ main ]
  schedule:
    - cron: '37 3 * * *'
  workflow_dispatch:
    inputs:
      make_webhook:
        description: 'Trigger from Make.com'
        required: false
        default: 'false'
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
      - run: pnpm exec tsx scripts/run-audit.ts --api="\$DASHBOARD_API" --token="\$DASHBOARD_TOKEN" --out=audit.json
      - uses: actions/upload-artifact@v4
        with:
          name: audit.json
          path: audit.json
`;

const DASHBOARD_API = 'https://myboss.up.railway.app/api/ingest';

export async function POST(req: NextRequest) {
  try {
    const { repos, token, dashboardToken } = await req.json();

    if (!repos || !Array.isArray(repos) || repos.length === 0) {
      return NextResponse.json({ error: 'Repositories array is required' }, { status: 400 });
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'GitHub token is required' }, { status: 400 });
    }

    if (!dashboardToken || typeof dashboardToken !== 'string') {
      return NextResponse.json({ error: 'Dashboard token is required' }, { status: 400 });
    }

    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MyBoss-Dashboard'
    };

    const results = [];
    const errors = [];

    // Create or update project in database
    const projectName = `GitHub Audit ${new Date().toISOString().split('T')[0]}`;
    const projectSlug = `github-audit-${Date.now()}`;
    
    const project = await db.project.create({
      data: {
        name: projectName,
        slug: projectSlug,
        provider: 'github',
        url: 'https://github.com'
      }
    });

    for (const repo of repos) {
      try {
        console.log(`Setting up audit for: ${repo.full_name}`);

        // Validate repository access first
        const repoCheckResponse = await fetch(`https://api.github.com/repos/${repo.full_name}`, {
          headers
        });

        if (!repoCheckResponse.ok) {
          if (repoCheckResponse.status === 404) {
            throw new Error(`Repository not found or no access: ${repo.full_name}`);
          }
          if (repoCheckResponse.status === 403) {
            throw new Error(`Access denied to repository: ${repo.full_name}`);
          }
          throw new Error(`Failed to access repository: ${repoCheckResponse.status}`);
        }

        // Create repo record in database
        const dbRepo = await db.repo.create({
          data: {
            projectId: project.id,
            fullName: repo.full_name,
            defaultBranch: repo.default_branch,
            type: 'github',
            url: `https://github.com/${repo.full_name}`,
            provider: 'github'
          }
        });

        // Check if .github/prompts directory exists
        let hasPrompts = false;
        try {
          const promptsRes = await fetch(`https://api.github.com/repos/${repo.full_name}/contents/.github/prompts`, {
            headers
          });
          hasPrompts = promptsRes.ok;
        } catch {
          // Directory doesn't exist, we'll skip this check
        }

        // Create/Update workflow file
        const workflowPath = '.github/workflows/audit.yml';
        const contentB64 = Buffer.from(WORKFLOW_CONTENT).toString('base64');
        
        // Get SHA if file exists
        let sha = undefined;
        try {
          const fileRes = await fetch(`https://api.github.com/repos/${repo.full_name}/contents/${encodeURIComponent(workflowPath)}`, {
            headers
          });
          if (fileRes.ok) {
            const fileJson = await fileRes.json();
            sha = fileJson.sha;
          }
        } catch {
          // File doesn't exist, that's fine
        }

        // PUT workflow file
        const workflowRes = await fetch(`https://api.github.com/repos/${repo.full_name}/contents/${encodeURIComponent(workflowPath)}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'ci: add/update audit workflow for MyBoss integration',
            content: contentB64,
            sha,
            branch: repo.default_branch,
          }),
        });

        if (!workflowRes.ok) {
          const errorBody = await workflowRes.text();
          if (workflowRes.status === 403) {
            throw new Error(`Insufficient permissions to create workflow. Please ensure token has 'workflow' scope.`);
          }
          if (workflowRes.status === 422) {
            throw new Error(`Invalid workflow configuration. Please check repository settings.`);
          }
          throw new Error(`Failed to create workflow (${workflowRes.status}): ${errorBody}`);
        }

        // Set up repository secrets
        const publicKeyRes = await fetch(`https://api.github.com/repos/${repo.full_name}/actions/secrets/public-key`, {
          headers
        });

        if (!publicKeyRes.ok) {
          if (publicKeyRes.status === 403) {
            throw new Error(`Insufficient permissions to manage repository secrets. Please ensure token has 'repo' scope with full access.`);
          }
          throw new Error(`Failed to get public key for secrets (${publicKeyRes.status})`);
        }

        const publicKey = await publicKeyRes.json();

        // Set secrets using the encryption script
        for (const [key, value] of [
          ['DASHBOARD_API', DASHBOARD_API],
          ['DASHBOARD_TOKEN', dashboardToken],
        ]) {
          try {
            // Use the existing encryption script
            const encrypted = execSync(`cd /home/runner/work/MyBoss/MyBoss && node ./scripts/gh-encrypt.js "${publicKey.key}" "${value}"`).toString().trim();
            
            const secretRes = await fetch(`https://api.github.com/repos/${repo.full_name}/actions/secrets/${key}`, {
              method: 'PUT',
              headers: { ...headers, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                encrypted_value: encrypted,
                key_id: publicKey.key_id,
              }),
            });

            if (!secretRes.ok) {
              console.error(`Failed to set secret ${key} for ${repo.full_name}: ${secretRes.status}`);
            }
          } catch (secretError) {
            console.error(`Failed to set secret ${key} for ${repo.full_name}:`, secretError);
            // Continue with other secrets
          }
        }

        results.push({
          repo: repo.full_name,
          success: true,
          dbRepoId: dbRepo.id,
          hasPrompts,
          workflowUrl: `https://github.com/${repo.full_name}/actions/workflows/audit.yml`
        });

      } catch (error) {
        console.error(`Error setting up ${repo.full_name}:`, error);
        errors.push({
          repo: repo.full_name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug
      },
      results,
      errors,
      setupCount: results.length,
      errorCount: errors.length
    });

  } catch (error) {
    console.error('Error in GitHub audit setup API:', error);
    return NextResponse.json(
      { error: 'Failed to setup audits' },
      { status: 500 }
    );
  }
}