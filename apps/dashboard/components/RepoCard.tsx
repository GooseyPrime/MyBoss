import React from 'react';

interface Repo {
  id: string;
  fullName: string;
  defaultBranch?: string | null;
}

interface RepoCardProps {
  repo: Repo;
}

export function RepoCard({ repo }: RepoCardProps) {
  return (
    <div className="rounded-lg bg-gray-900 border border-gray-700 p-4 mb-2">
      <div className="text-blue-300 font-mono text-sm">{repo.fullName}</div>
      <div className="text-gray-400 text-xs">Branch: {repo.defaultBranch}</div>
    </div>
  );
}
