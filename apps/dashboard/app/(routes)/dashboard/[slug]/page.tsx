import { db } from '../../../lib/db';
import { RepoCard } from '../../../components/RepoCard';
import { FindingCard } from '../../../components/FindingCard';
import React from 'react';
import Link from 'next/link';

interface Params { params: { slug: string } }

async function getProjectDetail(slug: string) {
  const project = await db.project.findUnique({
    where: { slug },
    include: {
      repos: true,
    },
  });
  if (!project) return null;
  // Get all audits for all repos in this project
  const repoIds = project.repos.map((r: any) => r.id);
  const audits = await db.auditRun.findMany({
    where: { repoId: { in: repoIds } },
    orderBy: { startedAt: 'desc' },
    include: {
      findings: true,
      patchPlans: true,
    },
  });
  // Placeholder: Calculate active work time (future: use commit/audit timestamps)
  const activeWorkTime = audits.length > 1 ? ((new Date(audits[0].startedAt).getTime() - new Date(audits[audits.length-1].startedAt).getTime()) / 1000 / 60 / 60).toFixed(2) + ' hrs' : 'N/A';
  // Placeholder: Fetch actionable issues/PRs from GitHub/GitLab API (future integration)
  const actionableLinks = [
    { label: 'Open Pull Requests', url: 'https://github.com/myboss/dev-dashboard/pulls' },
    { label: 'Open Issues', url: 'https://github.com/myboss/dev-dashboard/issues' },
    // Add more links or dynamic integration here
  ];
  return { ...project, audits, activeWorkTime, actionableLinks };
}

export default async function ProjectDetailPage({ params }: Params) {
  const project = await getProjectDetail(params.slug);
  if (!project) return <div className="text-white p-8">Project not found</div>;
  return (
    <div className="min-h-screen bg-black px-8 py-10">
      <div className="mb-4">
        <Link href="/dashboard" className="text-blue-400 hover:underline text-xs">← Back to Dashboard</Link>
      </div>
      <h1 className="text-3xl font-bold text-white mb-4">{project.name}</h1>
      <div className="mb-6 flex flex-wrap gap-2">
        {project.repos.map((repo: any) => <RepoCard key={repo.id} repo={repo} />)}
      </div>
      <div className="mb-4 flex gap-6">
        <div className="text-xs text-gray-400">Active Work Time: <span className="text-green-300 font-mono">{project.activeWorkTime}</span></div>
      </div>
      <h2 className="text-xl text-white font-semibold mb-2">Audit Runs</h2>
      <div className="space-y-8">
        {project.audits.map((audit: any) => (
          <div key={audit.id} className="rounded-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-black p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-200 font-mono text-sm">Commit: {audit.commitSha}</span>
              <span className="ml-2">
                {audit.status === 'passed' && <span title="Passed" className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1" />}
                {audit.status === 'partial' && <span title="Partial" className="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-1" />}
                {audit.status === 'failed' && <span title="Failed" className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1" />}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                audit.status === 'passed' ? 'bg-green-700 text-green-200' :
                audit.status === 'failed' ? 'bg-red-700 text-red-200' :
                audit.status === 'partial' ? 'bg-yellow-700 text-yellow-200' :
                'bg-gray-700 text-gray-300'
              }`}>
                {audit.status.toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-gray-400 mb-2">Started: {new Date(audit.startedAt).toLocaleString()}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-gray-300 font-semibold mb-1">Findings</h3>
                {audit.findings.length === 0 && <div className="text-gray-500 text-xs">No findings</div>}
                {audit.findings.map((finding: any) => <FindingCard key={finding.id} finding={finding} />)}
              </div>
              <div>
                <h3 className="text-gray-300 font-semibold mb-1">Patch Plans</h3>
                {audit.patchPlans.length === 0 && <div className="text-gray-500 text-xs">No patch plans</div>}
                {audit.patchPlans.map((plan: any) => (
                  <div key={plan.id} className="rounded-lg bg-gray-900 border border-gray-700 p-4 mb-2">
                    <div className="text-xs text-gray-400 mb-1">Rank: {plan.rank}</div>
                    <div className="text-xs text-gray-400 mb-1">Why: {plan.why}</div>
                    <div className="text-xs text-gray-400 mb-1">Files: {plan.files.join(', ')}</div>
                    <pre className="text-xs text-gray-500 bg-black rounded p-2 overflow-x-auto mt-2">{plan.diff}</pre>
                    <div className="text-xs text-gray-400 mt-1">Rollback: {plan.rollback}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Example: Link to active issues/PRs flagged for action (stub, replace with real links from integrations) */}
            <div className="mt-4">
              <h4 className="text-gray-300 font-semibold mb-1">Active Issues / PRs</h4>
              <ul className="list-disc list-inside text-blue-400 text-xs">
                {project.actionableLinks.map((link: { label: string; url: string }) => (
                  <li key={link.url}><Link href={link.url} target="_blank">{link.label}</Link></li>
                ))}
              </ul>
            </div>
            {/* Future Plan & Lookout Section */}
            <div className="mt-4">
              <h4 className="text-gray-300 font-semibold mb-1">Future Plan</h4>
              <div className="text-xs text-gray-400 mb-2">- Integrate with GitHub/GitLab APIs for live actionable issues/PRs.</div>
              <div className="text-xs text-gray-400 mb-2">- Add Kanban-style visualization for findings and patch plans.</div>
              <div className="text-xs text-gray-400 mb-2">- Calculate and visualize active work time per repo and audit.</div>
            </div>
            <div className="mt-2">
              <h4 className="text-gray-300 font-semibold mb-1">Lookout</h4>
              <div className="text-xs text-yellow-400 mb-2">- Watch for branding, compliance, and privacy policy issues flagged in findings.</div>
              <div className="text-xs text-yellow-400 mb-2">- Ensure all public-facing pages meet accessibility and legal requirements.</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
