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
      <h1 className="text-4xl font-bold text-white mb-8">Project Audits</h1>
      <div className="max-w-4xl mx-auto">
        <DashboardClient />
        
        {projects.length > 0 ? (
          projects.map((project: Project) => (
            <Link key={project.id} href={`/dashboard/${project.slug}`} className="block hover:scale-[1.01] transition-transform">
              <ProjectCard name={project.name} slug={project.slug} repos={project.repos} latestAudit={project.latestAudit} />
            </Link>
          ))
        ) : (
          <div className="text-center text-gray-400 mt-8">
            <p>No projects found. Use the GitHub Repository Audit Setup above to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
