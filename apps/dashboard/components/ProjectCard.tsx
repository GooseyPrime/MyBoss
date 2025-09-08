import React from 'react';

interface Repo {
  id: string;
  fullName: string;
  defaultBranch?: string | null;
}

interface AuditRunCard {
  status: string;
  startedAt: string;
  findingsCount: number;
  p0Count: number;
  p1Count: number;
}

interface ProjectCardProps {
  name: string;
  slug: string;
  repos: Repo[];
  latestAudit?: AuditRunCard;
}

export function ProjectCard({ name, slug, repos, latestAudit }: ProjectCardProps) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-gray-900 to-black border border-gray-700 shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-white">{name}</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          latestAudit?.status === 'passed' ? 'bg-green-700 text-green-200' :
          latestAudit?.status === 'failed' ? 'bg-red-700 text-red-200' :
          latestAudit?.status === 'partial' ? 'bg-yellow-700 text-yellow-200' :
          'bg-gray-700 text-gray-300'
        }`}>
          {latestAudit?.status?.toUpperCase() || 'NO AUDIT'}
        </span>
      </div>
      <div className="text-gray-400 text-sm mb-2">Slug: {slug}</div>
      <div className="flex flex-wrap gap-2 mb-2">
        {repos.map(repo => (
          <span key={repo.id} className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs font-mono">{repo.fullName}</span>
        ))}
      </div>
      {latestAudit && (
        <div className="flex items-center gap-6 mt-2">
          <div className="text-gray-300 text-xs">Last Run: {new Date(latestAudit.startedAt).toLocaleString()}</div>
          <div className="flex gap-2">
            <span className="bg-red-800 text-red-200 px-2 py-1 rounded text-xs">P0: {latestAudit.p0Count}</span>
            <span className="bg-yellow-800 text-yellow-200 px-2 py-1 rounded text-xs">P1: {latestAudit.p1Count}</span>
            <span className="bg-gray-800 text-gray-200 px-2 py-1 rounded text-xs">Findings: {latestAudit.findingsCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
