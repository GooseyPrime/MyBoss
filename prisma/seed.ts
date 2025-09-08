import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Upsert project
  const project = await prisma.project.upsert({
    where: { slug: 'dev-dashboard' },
    update: {},
    create: {
      name: 'Dev Dashboard',
      slug: 'dev-dashboard',
      repos: {
        create: {
          fullName: 'myboss/dev-dashboard',
          defaultBranch: 'main',
        },
      },
    },
    include: { repos: true },
  });

  // Upsert repo
  const repo = await prisma.repo.upsert({
    where: { fullName: 'myboss/dev-dashboard' },
    update: {},
    create: {
      fullName: 'myboss/dev-dashboard',
      defaultBranch: 'main',
      project: { connect: { slug: 'dev-dashboard' } },
    },
  });

  // Upsert audit_run
  const auditRun = await prisma.auditRun.upsert({
    where: { commitSha: 'abc123def456' },
    update: {},
    create: {
      commitSha: 'abc123def456',
      status: 'partial',
      repo: { connect: { fullName: 'myboss/dev-dashboard' } },
    },
  });

  // Upsert findings
  await prisma.finding.upsert({
    where: { title: 'Node version mismatch in deploy workflow' },
    update: {},
    create: {
      kind: 'ci',
      title: 'Node version mismatch in deploy workflow',
      severity: 'high',
      fileRefs: ['.github/workflows/deploy.yml'],
      detail: { node: { workflow: '16', required: '20' }, why: "Deploys fail; prod won’t update" },
      auditRun: { connect: { commitSha: 'abc123def456' } },
    },
  });
  await prisma.finding.upsert({
    where: { title: 'Missing Privacy Policy page' },
    update: {},
    create: {
      kind: 'compliance',
      title: 'Missing Privacy Policy page',
      severity: 'medium',
      fileRefs: [],
      detail: { why: 'Distribution blockers in app stores/SEO', workaround: 'Add /privacy and link in footer' },
      auditRun: { connect: { commitSha: 'abc123def456' } },
    },
  });

  // Upsert patch_plan
  await prisma.patchPlan.upsert({
    where: { rank: 1 },
    update: {},
    create: {
      rank: 1,
      why: 'Fix CI runtime to unbreak deploys',
      files: ['.github/workflows/deploy.yml'],
      diff: `--- a/.github/workflows/deploy.yml\n+++ b/.github/workflows/deploy.yml\n@@ -1,6 +1,6 @@\n jobs:\n   build:\n-    runs-on: ubuntu-latest\n-    strategy:\n-      matrix:\n-        node-version: [16]\n+    runs-on: ubuntu-latest\n+    strategy:\n+      matrix:\n+        node-version: [20]\n`,
      rollback: 'git revert <commit>',
      auditRun: { connect: { commitSha: 'abc123def456' } },
    },
  });
}

main()
  .then(() => {
    console.log('Seed complete. Project, repo, audit_run, findings, and patch_plan upserted.');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
