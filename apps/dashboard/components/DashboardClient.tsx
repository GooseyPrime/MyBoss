'use client';

import React, { useState } from 'react';
import { GitHubRepoSelector } from './GitHubRepoSelector';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  default_branch: string;
  private: boolean;
  description?: string;
}

export function DashboardClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReposSelected = async (repos: GitHubRepo[], token: string) => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      // For development, use a placeholder token or prompt user
      const dashboardToken = await promptForDashboardToken();
      
      if (!dashboardToken) {
        throw new Error('Dashboard token is required for audit setup');
      }

      const response = await fetch('/api/github/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repos,
          token,
          dashboardToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to setup audits');
      }

      const result = await response.json();
      
      setMessage(`Successfully set up audits for ${result.setupCount} repositories. ${result.errorCount > 0 ? `${result.errorCount} repositories had errors.` : ''}`);
      
      if (result.errors && result.errors.length > 0) {
        console.error('Setup errors:', result.errors);
      }

      // Redirect to the project page after a delay
      setTimeout(() => {
        window.location.href = `/dashboard/${result.project.slug}`;
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup audits');
    } finally {
      setIsLoading(false);
    }
  };

  const promptForDashboardToken = (): Promise<string> => {
    return new Promise((resolve) => {
      const token = prompt('Enter Dashboard Token (for API authentication):\n\nFor development, you can use any string like "dev-token"');
      resolve(token || '');
    });
  };

  return (
    <div>
      <GitHubRepoSelector onReposSelected={handleReposSelected} />
      
      {isLoading && (
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
            <p className="text-blue-200">Setting up audit workflows...</p>
          </div>
        </div>
      )}

      {message && (
        <div className="bg-green-900 border border-green-700 rounded-lg p-4 mb-4">
          <p className="text-green-200">{message}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}