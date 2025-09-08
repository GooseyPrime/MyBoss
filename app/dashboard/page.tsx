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
  
  return (
    <div className="min-h-screen bg-black px-8 py-10">
      <h1 className="text-4xl font-bold text-white mb-8">Project Audits</h1>
      <div className="max-w-4xl mx-auto">
        {projects.length === 0 ? (
          <div className="text-white text-center py-8">
            <p>No projects found. Add projects via the API to get started.</p>
          </div>
        ) : (
          projects.map((project: Project) => (
            <Link key={project.id} href={`/dashboard/${project.slug}`} className="block hover:scale-[1.01] transition-transform">
              <div className="bg-gray-900 rounded-lg p-6 mb-4 border border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{project.name}</h2>
                    <p className="text-gray-400 text-sm">/{project.slug}</p>
                  </div>
                  {project.latestAudit && (
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.latestAudit.status === 'completed' ? 'bg-green-900 text-green-200' :
                        project.latestAudit.status === 'failed' ? 'bg-red-900 text-red-200' :
                        'bg-yellow-900 text-yellow-200'
                      }`}>
                        {project.latestAudit.status}
                      </div>
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(project.latestAudit.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-300">
                    Repos: <span className="text-blue-400">{project.repos.length}</span>
                  </span>
                  {project.latestAudit && (
                    <>
                      <span className="text-gray-300">
                        Findings: <span className="text-yellow-400">{project.latestAudit.findingsCount}</span>
                      </span>
                      {project.latestAudit.p0Count > 0 && (
                        <span className="text-gray-300">
                          Critical: <span className="text-red-400">{project.latestAudit.p0Count}</span>
                        </span>
                      )}
                      {project.latestAudit.p1Count > 0 && (
                        <span className="text-gray-300">
                          High: <span className="text-orange-400">{project.latestAudit.p1Count}</span>
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
