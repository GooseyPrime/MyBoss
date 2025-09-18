import { NextRequest, NextResponse } from 'next/server';

const TARGET_USERS = ['GooseyPrime', 'InTellMe'];

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  default_branch: string;
  private: boolean;
  description?: string;
  owner: {
    login: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'GitHub token is required' }, { status: 400 });
    }

    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MyBoss-Dashboard'
    };

    const allRepos: GitHubRepo[] = [];

    // Fetch repositories for each target user
    for (const username of TARGET_USERS) {
      try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
          headers
        });

        if (!response.ok) {
          if (response.status === 401) {
            return NextResponse.json({ error: 'Invalid GitHub token or insufficient permissions' }, { status: 401 });
          }
          if (response.status === 403) {
            return NextResponse.json({ error: 'GitHub API rate limit exceeded or token lacks required scopes' }, { status: 403 });
          }
          throw new Error(`Failed to fetch repos for ${username}: ${response.status}`);
        }

        const repos: GitHubRepo[] = await response.json();
        allRepos.push(...repos);
      } catch (error) {
        console.error(`Error fetching repos for ${username}:`, error);
        // Continue with other users even if one fails
      }
    }

    // Sort repositories by last updated (most recent first)
    allRepos.sort((a, b) => {
      // Note: We'd need updated_at field for proper sorting, but this is basic alphabetical for now
      return a.full_name.localeCompare(b.full_name);
    });

    return NextResponse.json({
      repos: allRepos,
      count: allRepos.length
    });

  } catch (error) {
    console.error('Error in GitHub repos API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}