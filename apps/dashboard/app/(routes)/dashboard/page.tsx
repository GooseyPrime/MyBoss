import { db } from '../../../lib/db';
import { ProjectCard } from '../../../components/ProjectCard';
import { DashboardClient } from '../../../components/DashboardClient';
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
    const latestAudit = await db.auditRun.findFirst({
      where: { repoId: { in: repoIds } },
      orderBy: { startedAt: 'desc' },
    });

    // For each project, get the latest audit run and findings summary
    const results = await Promise.all(projects.map(async (project: ProjectWithRepos) => {
      const repoIds = project.repos.map((r: Repo) => r.id);
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
      <h1 className="text-4xl font-bold text-white mb-8">Project Dashboard</h1>
      <p className="text-gray-400 mb-6">
        Monitor project health, build status, security audits, and action plans across all your repositories.
      </p>
      <div className="max-w-4xl mx-auto">
        {projects.map((project: Project) => (
          <Link key={project.id} href={`/dashboard/${project.slug}`} className="block hover:scale-[1.01] transition-transform">
            <ProjectCard 
              name={project.name} 
              slug={project.slug} 
              repos={project.repos} 
              latestAudit={project.latestAudit}
              health={project.health || undefined}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
