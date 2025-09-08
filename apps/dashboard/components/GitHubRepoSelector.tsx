'use client';

import React, { useState } from 'react';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  default_branch: string;
  private: boolean;
  description?: string;
}

interface GitHubRepoSelectorProps {
  onReposSelected?: (repos: GitHubRepo[], token: string) => void;
}

export function GitHubRepoSelector({ onReposSelected }: GitHubRepoSelectorProps) {
  const [token, setToken] = useState('');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToken, setShowToken] = useState(false);

  const fetchRepos = async () => {
    if (!token.trim()) {
      setError('Please enter a GitHub Personal Access Token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/github/repos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch repositories');
      }

      const data = await response.json();
      setRepos(data.repos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRepo = (repoId: number) => {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId);
    } else {
      newSelected.add(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const selectAll = () => {
    setSelectedRepos(new Set(repos.map(repo => repo.id)));
  };

  const selectNone = () => {
    setSelectedRepos(new Set());
  };

  const handleSetupAudits = () => {
    const selectedRepoData = repos.filter(repo => selectedRepos.has(repo.id));
    if (onReposSelected) {
      onReposSelected(selectedRepoData, token);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">GitHub Repository Audit Setup</h2>
      
      {/* Token Input */}
      <div className="mb-6">
        <label htmlFor="github-token" className="block text-sm font-medium text-gray-300 mb-2">
          GitHub Personal Access Token
        </label>
        <div className="relative">
          <input
            id="github-token"
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_..."
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute inset-y-0 right-0 px-3 py-2 text-gray-400 hover:text-white"
          >
            {showToken ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Requires 'repo' and 'workflow' scopes to fetch repositories and set up audit workflows
        </p>
      </div>

      {/* Fetch Button */}
      <button
        onClick={fetchRepos}
        disabled={loading || !token.trim()}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg mb-4"
      >
        {loading ? 'Fetching Repositories...' : 'Fetch GooseyPrime & InTellMe Repositories'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-3 mb-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Repository List */}
      {repos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Select Repositories ({selectedRepos.size}/{repos.length} selected)
            </h3>
            <div className="space-x-2">
              <button
                onClick={selectAll}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Select All
              </button>
              <button
                onClick={selectNone}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Select None
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 mb-4">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedRepos.has(repo.id)
                    ? 'bg-blue-900 border-blue-600'
                    : 'bg-gray-800 border-gray-600 hover:bg-gray-750'
                }`}
                onClick={() => toggleRepo(repo.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedRepos.has(repo.id)}
                  onChange={() => toggleRepo(repo.id)}
                  className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-white font-medium">{repo.full_name}</div>
                  {repo.description && (
                    <div className="text-gray-400 text-sm">{repo.description}</div>
                  )}
                  <div className="text-gray-500 text-xs">
                    Branch: {repo.default_branch} • {repo.private ? 'Private' : 'Public'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedRepos.size > 0 && (
            <button
              onClick={handleSetupAudits}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Setup Audits for {selectedRepos.size} Repository{selectedRepos.size !== 1 ? 'ies' : ''}
            </button>
          )}
        </div>
      )}
    </div>
  );
}