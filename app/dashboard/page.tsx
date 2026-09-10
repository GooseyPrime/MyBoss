import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

// Force dynamic rendering to avoid database connection during build
export const dynamic = 'force-dynamic';

const db = new PrismaClient();

interface Repo {
  id: string;
  fullName: string;
  defaultBranch?: string | null;
}

interface ProjectWithRepos {
  id: string;
  name: string;
  slug: string;
  repos: Repo[];
}

interface Project {
  id: string;
  name: string;
  slug: string;
  repos: Repo[];
  latestAudit?: {
    status: string;
    startedAt: string;
    findingsCount: number;
    p0Count: number;
    p1Count: number;
  };
}

async function getProjectsWithLatestAudit(): Promise<Project[]> {
  try {
    // Query all projects with their repos and latest audit run
    const projects = await db.project.findMany({
      include: {
        repos: true,
      },
      orderBy: { name: 'asc' },
    });

    // For each project, get the latest audit run and findings summary
    const results = await Promise.all(projects.map(async (project: ProjectWithRepos) => {
      const repoIds = project.repos.map((r: Repo) => r.id);
      if (repoIds.length === 0) {
        return {
          ...project,
          latestAudit: undefined,
        };
      }

      const latestAudit = await db.auditRun.findFirst({
        where: { repoId: { in: repoIds } },
        orderBy: { startedAt: 'desc' },
      });
      let findingsCount = 0, p0Count = 0, p1Count = 0;
      if (latestAudit) {
        findingsCount = await db.finding.count({ where: { auditId: latestAudit.id } });
        p0Count = await db.finding.count({ where: { auditId: latestAudit.id, severity: 'critical' } });
        p1Count = await db.finding.count({ where: { auditId: latestAudit.id, severity: 'high' } });
      }
      return {
        ...project,
        latestAudit: latestAudit ? {
          status: latestAudit.status,
          startedAt: latestAudit.startedAt.toISOString(),
          findingsCount,
          p0Count,
          p1Count,
        } : undefined,
      };
    }));

    return results;
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
}

export default async function DashboardPage() {
  const projects = await getProjectsWithLatestAudit();
  const cardStyle = {
    background: 'linear-gradient(180deg, rgba(18, 24, 38, 0.98), rgba(10, 14, 22, 0.98))',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    borderRadius: '24px',
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
  } as const;

  return (
    <main style={{ minHeight: '100vh', padding: '56px 24px 72px' }}>
      <div style={{ margin: '0 auto', maxWidth: '1080px' }}>
        <div style={{ marginBottom: '32px' }}>
          <p style={{ color: 'rgba(184, 194, 215, 0.82)', fontSize: '0.78rem', letterSpacing: '0.22em', margin: 0, textTransform: 'uppercase' }}>
            Internal tool
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.4rem, 4vw, 4rem)', fontWeight: 600, letterSpacing: '-0.03em', margin: '10px 0 12px' }}>
            Project status dashboard
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.7, margin: 0, maxWidth: '720px' }}>
            Monitor repository health, audit activity, and next actions across configured projects in a dark-only workspace.
          </p>
        </div>

        {projects.length === 0 ? (
          <section style={{ ...cardStyle, padding: '32px' }}>
            <div style={{ background: 'rgba(74, 90, 122, 0.18)', border: '1px solid rgba(74, 90, 122, 0.4)', borderRadius: '999px', color: '#d7e0f2', display: 'inline-flex', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '18px', padding: '8px 12px', textTransform: 'uppercase' }}>
              No configured projects
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', margin: '0 0 12px' }}>
              Start with configuration, not a crash.
            </h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7, margin: '0 0 14px', maxWidth: '720px' }}>
              MyBoss is ready, but there are no projects in the database yet. Add a project through the ingest API or seed data, then return here to review project and repository status.
            </p>
            <p style={{ color: 'var(--soft)', lineHeight: 1.7, margin: 0 }}>
              Required environment: <code>DATABASE_URL</code> and <code>DASHBOARD_TOKEN</code>. If your audit runner needs a specific callback endpoint, set <code>INGEST_URL</code> to any reachable internal, local, or public URL.
            </p>
          </section>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {projects.map((project: Project) => (
              <Link key={project.id} href={`/dashboard/${project.slug}`}>
                <article style={{ ...cardStyle, padding: '28px' }}>
                  <div style={{ alignItems: 'flex-start', display: 'flex', gap: '16px', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', margin: '0 0 6px' }}>{project.name}</h2>
                      <p style={{ color: 'var(--soft)', fontSize: '0.95rem', margin: 0 }}>/{project.slug}</p>
                    </div>
                    <div style={{ alignItems: 'center', background: 'rgba(74, 90, 122, 0.18)', border: '1px solid rgba(74, 90, 122, 0.4)', borderRadius: '999px', color: '#dbe5f8', display: 'inline-flex', fontSize: '0.8rem', fontWeight: 600, minHeight: '36px', padding: '0 14px', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                      {project.latestAudit?.status || 'No audit yet'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                    <span style={{ background: 'rgba(74, 90, 122, 0.18)', borderRadius: '999px', color: '#d7e0f2', fontSize: '0.82rem', padding: '8px 12px' }}>
                      Repos: {project.repos.length}
                    </span>
                    <span style={{ background: 'rgba(74, 90, 122, 0.18)', borderRadius: '999px', color: '#d7e0f2', fontSize: '0.82rem', padding: '8px 12px' }}>
                      Findings: {project.latestAudit?.findingsCount ?? 0}
                    </span>
                    <span style={{ background: 'rgba(74, 90, 122, 0.18)', borderRadius: '999px', color: '#d7e0f2', fontSize: '0.82rem', padding: '8px 12px' }}>
                      Critical: {project.latestAudit?.p0Count ?? 0}
                    </span>
                    <span style={{ background: 'rgba(74, 90, 122, 0.18)', borderRadius: '999px', color: '#d7e0f2', fontSize: '0.82rem', padding: '8px 12px' }}>
                      High: {project.latestAudit?.p1Count ?? 0}
                    </span>
                  </div>
                  <p style={{ color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                    {project.repos.length === 0
                      ? 'This project exists, but it does not have any repositories configured yet.'
                      : `Latest audit: ${project.latestAudit ? new Date(project.latestAudit.startedAt).toLocaleString() : 'No audit data yet.'}`}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
