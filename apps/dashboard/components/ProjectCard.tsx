import React from 'react';

interface Repo {
  id: string;
  fullName: string;
  defaultBranch?: string | null;
  buildStatus?: string | null;
  openPrCount?: number;
  openIssueCount?: number;
  healthScore?: number | null;
}

interface AuditRunCard {
  status: string;
  startedAt: string;
  findingsCount: number;
  p0Count: number;
  p1Count: number;
}

interface ProjectHealth {
  overallScore: number;
  buildScore: number;
  securityScore: number;
}

interface ProjectCardProps {
  name: string;
  slug: string;
  repos: Repo[];
  latestAudit?: AuditRunCard;
  health?: ProjectHealth;
}

export function ProjectCard({ name, slug, repos, latestAudit }: ProjectCardProps) {
  // Calculate aggregate repo stats
  const totalPRs = repos.reduce((sum, repo) => sum + (repo.openPrCount || 0), 0);
  const totalIssues = repos.reduce((sum, repo) => sum + (repo.openIssueCount || 0), 0);
  const passingBuilds = repos.filter(repo => repo.buildStatus === 'passing').length;
  const avgHealthScore = repos.length > 0 
    ? repos.reduce((sum, repo) => sum + (repo.healthScore || 0), 0) / repos.length 
    : 0;

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="rounded-xl bg-gradient-to-br from-gray-900 to-black border border-gray-700 shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">{name}</h2>
        <div className="flex gap-2">
          {/* Build Status */}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            passingBuilds === repos.length ? 'bg-green-700 text-green-200' :
            passingBuilds > 0 ? 'bg-yellow-700 text-yellow-200' :
            'bg-red-700 text-red-200'
          }`}>
            BUILD: {passingBuilds}/{repos.length}
          </span>
          
          {/* Security Audit Status */}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            latestAudit?.status === 'passed' ? 'bg-green-700 text-green-200' :
            latestAudit?.status === 'failed' ? 'bg-red-700 text-red-200' :
            latestAudit?.status === 'partial' ? 'bg-yellow-700 text-yellow-200' :
            'bg-gray-700 text-gray-300'
          }`}>
            AUDIT: {latestAudit?.status?.toUpperCase() || 'NONE'}
          </span>
        </div>
      </div>
      
      <div className="text-gray-400 text-sm mb-3">Slug: {slug}</div>
      
      {/* Repository List */}
      <div className="flex flex-wrap gap-2 mb-4">
        {repos.map(repo => (
          <span key={repo.id} className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs font-mono">
            {repo.fullName}
            {repo.buildStatus && (
              <span className={`ml-1 ${
                repo.buildStatus === 'passing' ? 'text-green-300' :
                repo.buildStatus === 'failing' ? 'text-red-300' :
                'text-gray-300'
              }`}>
                [{repo.buildStatus}]
              </span>
            )}
          </span>
        ))}
      </div>

      {/* General Project Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800 rounded p-3">
          <h4 className="text-white text-sm font-semibold mb-2">Project Activity</h4>
          <div className="flex gap-4 text-xs">
            <span className="text-blue-300">PRs: {totalPRs}</span>
            <span className="text-orange-300">Issues: {totalIssues}</span>
          </div>
          {avgHealthScore > 0 && (
            <div className="mt-1">
              <span className={`text-xs font-medium ${getHealthColor(avgHealthScore)}`}>
                Health: {avgHealthScore.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded p-3">
          <h4 className="text-white text-sm font-semibold mb-2">Security Overview</h4>
          {latestAudit ? (
            <div className="flex gap-2 text-xs">
              <span className="bg-red-800 text-red-200 px-2 py-1 rounded">P0: {latestAudit.p0Count}</span>
              <span className="bg-yellow-800 text-yellow-200 px-2 py-1 rounded">P1: {latestAudit.p1Count}</span>
            </div>
          ) : (
            <div className="text-gray-400 text-xs">No security audit data</div>
          )}
        </div>
      </div>

      {/* Timeline Info */}
      {latestAudit && (
        <div className="text-gray-400 text-xs">
          Last Security Audit: {new Date(latestAudit.startedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
