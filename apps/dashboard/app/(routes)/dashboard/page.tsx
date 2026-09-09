import { db } from '../../../lib/db';
import { DashboardClient } from '../../../components/DashboardClient';
import { ProjectCard } from '../../../components/ProjectCard';
import React from 'react';
import Link from 'next/link';

// Force dynamic rendering to avoid database connection during build
export const dynamic = 'force-dynamic';

interface Repo {
  id: string;
  fullName: string;
  defaultBranch?: string | null;
  buildStatus?: string | null;
  openPrCount?: number;
  openIssueCount?: number;
  healthScore?: number | null;
}

interface ProjectWithRepos {
  id: string;
  name: string;
  slug: string;
  repos: Repo[];
  health?: {
    overallScore: number;
    buildScore: number;
    securityScore: number;
  } | null;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  repos: Repo[];
  health?: {
    overallScore: number;
    buildScore: number;
    securityScore: number;
  } | null;
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
        repos: {
          select: {
            id: true,
            fullName: true,
            defaultBranch: true,
            buildStatus: true,
            openPrCount: true,
            openIssueCount: true,
            healthScore: true,
          }
        },
        health: {
          select: {
            overallScore: true,
            buildScore: true,
            securityScore: true,
          }
        },
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
        p0Count = await db.finding.count({ where: { auditId: latestAudit.id, severity: 'high' } });
        p1Count = await db.finding.count({ where: { auditId: latestAudit.id, severity: 'medium' } });
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
    return results as Project[];
  } catch (error) {
    console.error('Database error:', error);
    // Return empty array if database is not available
    return [];
  }
}

export default async function DashboardPage() {
  const projects = await getProjectsWithLatestAudit();
  return (
    <div className="min-h-screen bg-black px-8 py-10">
      <p className="text-sm uppercase tracking-[0.24em] text-slate-400 mb-3">
        Internal tool
      </p>
      <h1 className="text-4xl font-bold text-white mb-4" style={{ color: '#F4F7FB', fontFamily: '"Fraunces", Georgia, serif' }}>
        Project Dashboard
      </h1>
      <p className="text-gray-400 mb-6" style={{ color: '#B8C2D7', fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>
        Monitor project health, build status, security audits, and action plans across all your repositories.
      </p>
      <div className="max-w-4xl mx-auto space-y-8">
        {projects.length === 0 ? (
          <div className="rounded-3xl border p-8" style={{ background: 'linear-gradient(180deg, rgba(18, 24, 38, 0.98), rgba(10, 14, 22, 0.98))', borderColor: 'rgba(74, 90, 122, 0.38)' }}>
            <div className="inline-flex rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]" style={{ background: 'rgba(74, 90, 122, 0.18)', borderColor: 'rgba(74, 90, 122, 0.4)', color: '#DBE5F8' }}>
              No configured projects
            </div>
            <h2 className="text-2xl text-white mt-5 mb-3" style={{ fontFamily: '"Fraunces", Georgia, serif' }}>
              Start with setup, not a crash.
            </h2>
            <p className="text-sm leading-7 mb-3" style={{ color: '#B8C2D7', fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>
              The status dashboard can render with an empty database. Configure a project via the ingest API, seed data, or use the GitHub setup tool below to start wiring repositories in.
            </p>
            <p className="text-sm leading-7 m-0" style={{ color: '#8C98B2', fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>
              Required environment: <code>DATABASE_URL</code> and <code>DASHBOARD_TOKEN</code>. Set <code>INGEST_URL</code> only when the workflow runner should call a specific callback URL.
            </p>
          </div>
        ) : (
          projects.map((project: Project) => (
            <Link key={project.id} href={`/dashboard/${project.slug}`} className="block hover:scale-[1.01] transition-transform">
              <ProjectCard
                name={project.name}
                slug={project.slug}
                repos={project.repos}
                latestAudit={project.latestAudit}
                health={project.health || undefined}
              />
            </Link>
          ))
        )}

        <DashboardClient />
      </div>
    </div>
  );
}
