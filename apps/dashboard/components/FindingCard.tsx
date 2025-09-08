import React from 'react';

interface Finding {
  id: string;
  kind: string;
  title: string;
  severity: string;
  fileRefs: string[];
  detail: any;
}

interface FindingCardProps {
  finding: Finding;
}

export function FindingCard({ finding }: FindingCardProps) {
  return (
    <div className="rounded-lg bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 p-4 mb-2">
      <div className="flex items-center gap-2 mb-1">
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          finding.severity === 'high' ? 'bg-red-700 text-red-200' :
          finding.severity === 'medium' ? 'bg-yellow-700 text-yellow-200' :
          'bg-gray-700 text-gray-300'
        }`}>
          {finding.severity.toUpperCase()}
        </span>
        <span className="text-sm text-white font-semibold">{finding.title}</span>
      </div>
      <div className="text-xs text-gray-400 mb-1">Kind: {finding.kind}</div>
      <div className="text-xs text-gray-400 mb-1">Files: {finding.fileRefs.join(', ')}</div>
      <pre className="text-xs text-gray-500 bg-black rounded p-2 overflow-x-auto mt-2">{JSON.stringify(finding.detail, null, 2)}</pre>
    </div>
  );
}
