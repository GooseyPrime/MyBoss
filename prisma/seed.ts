import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Upsert project
  await prisma.project.upsert({
    where: { slug: 'dev-dashboard' },
    update: {},
    create: {
      name: 'Dev Dashboard',
      slug: 'dev-dashboard',
      url: 'https://github.com/myboss/dev-dashboard',
      repos: {
        create: {
          fullName: 'myboss/dev-dashboard',
          defaultBranch: 'main',
        },
      },
    },
    include: { repos: true },
  });

  // Upsert repo with new general tracking fields
  await prisma.repo.upsert({
    where: { fullName: 'myboss/dev-dashboard' },
    update: {},
    create: {
      fullName: 'myboss/dev-dashboard',
      defaultBranch: 'main',
      buildStatus: 'passing',
      lastBuildAt: new Date(),
      openPrCount: 2,
      openIssueCount: 5,
      healthScore: 85.5,
      isArchived: false,
      project: { connect: { slug: 'dev-dashboard' } },
    },
  });

  // Upsert audit_run
  await prisma.auditRun.upsert({
    where: { commitSha: 'abc123def456' },
    update: {},
    create: {
      repo: { connect: { fullName: 'myboss/dev-dashboard' } },
      commitSha: 'abc123def456',
      status: 'partial',
      startedAt: new Date(),
    },
  });

  // Upsert findings
  await prisma.finding.upsert({
    where: { id: 'finding-1' },
    update: {},
    create: {
      id: 'finding-1',
      audit: { connect: { commitSha: 'abc123def456' } },
      kind: 'ci',
      title: 'Node version mismatch in deploy workflow',
      severity: 'high',
      fileRefs: ['.github/workflows/deploy.yml'],
      detail: { node: { workflow: '16', required: '20' }, why: "Deploys fail; prod won’t update" },
      createdAt: new Date(),
    },
  });
  await prisma.finding.upsert({
    where: { id: 'finding-2' },
    update: {},
    create: {
      id: 'finding-2',
      audit: { connect: { commitSha: 'abc123def456' } },
      kind: 'compliance',
      title: 'Missing Privacy Policy page',
      severity: 'medium',
      fileRefs: [],
      detail: { why: 'Distribution blockers in app stores/SEO', workaround: 'Add /privacy and link in footer' },
      createdAt: new Date(),
    },
  });

  // Upsert patch_plan
  await prisma.patchPlan.upsert({
    where: { id: 'patchplan-1' },
    update: {},
    create: {
      id: 'patchplan-1',
      audit: { connect: { commitSha: 'abc123def456' } },
      rank: 1,
      why: 'Fix CI runtime to unbreak deploys',
      files: ['.github/workflows/deploy.yml'],
      diff: `--- a/.github/workflows/deploy.yml\n+++ b/.github/workflows/deploy.yml\n@@ -1,6 +1,6 @@\n jobs:\n   build:\n-    runs-on: ubuntu-latest\n-    strategy:\n-      matrix:\n-        node-version: [16]\n+    runs-on: ubuntu-latest\n+    strategy:\n+      matrix:\n+        node-version: [20]\n`,
      rollback: 'git revert <commit>',
      createdAt: new Date(),
    },
  });

  // Add seed data for new general project tracking models
  
  // Project Health
  await prisma.projectHealth.upsert({
    where: { projectId: (await prisma.project.findUnique({ where: { slug: 'dev-dashboard' } }))?.id || '' },
    update: {},
    create: {
      project: { connect: { slug: 'dev-dashboard' } },
      overallScore: 85.5,
      buildScore: 90,
      securityScore: 75,
      codeQuality: 88,
      activity: 92,
      lastUpdated: new Date(),
      metrics: {
        testCoverage: 82,
        documentsUpToDate: true,
        dependenciesUpToDate: 15,
        totalDependencies: 18
      }
    }
  });

  // Build Run
  await prisma.buildRun.upsert({
    where: { id: 'build-1' },
    update: {},
    create: {
      id: 'build-1',
      repo: { connect: { fullName: 'myboss/dev-dashboard' } },
      commitSha: 'def456ghi789',
      status: 'success',
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      finishedAt: new Date(Date.now() - 3540000), // 59 minutes ago
      duration: 60,
      buildTool: 'pnpm',
      artifacts: {
        size: '2.3MB',
        files: ['dist/index.js', 'dist/styles.css']
      }
    }
  });

  // Action Plan
  await prisma.actionPlan.upsert({
    where: { id: 'action-1' },
    update: {},
    create: {
      id: 'action-1',
      repo: { connect: { fullName: 'myboss/dev-dashboard' } },
      title: 'Upgrade Dependencies and Improve Security',
      description: 'Update outdated dependencies and address security vulnerabilities found in the latest audit.',
      status: 'in_progress',
      priority: 'high',
      category: 'security',
      assignee: 'dev-team',
      dueDate: new Date(Date.now() + 7 * 24 * 3600000), // 1 week from now
      tasks: {
        create: [
          {
            title: 'Update Node.js version in CI',
            description: 'Update from Node 16 to Node 20 in GitHub Actions',
            status: 'done',
            order: 1
          },
          {
            title: 'Update npm dependencies',
            description: 'Run npm audit fix and update major versions',
            status: 'in_progress',
            order: 2
          },
          {
            title: 'Add security headers',
            description: 'Implement security headers in Next.js config',
            status: 'todo',
            order: 3
          }
        ]
      }
    }
  });

  // Second Action Plan for general project management
  await prisma.actionPlan.upsert({
    where: { id: 'action-2' },
    update: {},
    create: {
      id: 'action-2',
      repo: { connect: { fullName: 'myboss/dev-dashboard' } },
      title: 'Improve Build Performance',
      description: 'Optimize build times and add caching to CI pipeline.',
      status: 'open',
      priority: 'medium',
      category: 'build',
      dueDate: new Date(Date.now() + 14 * 24 * 3600000), // 2 weeks from now
      tasks: {
        create: [
          {
            title: 'Add build caching',
            description: 'Implement caching for node_modules and build artifacts',
            status: 'todo',
            order: 1
          },
          {
            title: 'Optimize bundle size',
            description: 'Analyze and reduce JavaScript bundle size',
            status: 'todo',
            order: 2
          }
        ]
      }
    }
  });

  console.log('Seed complete. Project, repo, audit_run, findings, patch_plan, and new general tracking data upserted.');
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
