import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { 
      repos, 
      token,
      dashboardToken,
      projectId 
    } = await req.json();

    // Validate required fields
    if (!repos || !Array.isArray(repos)) {
      return NextResponse.json({ error: 'repos array is required' }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ error: 'GitHub token is required' }, { status: 400 });
    }

    if (!dashboardToken) {
      return NextResponse.json({ error: 'Dashboard token is required' }, { status: 400 });
    }

    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MyBoss-MakeCom'
    };

    const results = [];
    const errors = [];

    // Trigger GitHub Actions workflows for each repository
    for (const repoFullName of repos) {
      try {
        console.log(`Triggering audit workflow for: ${repoFullName}`);

        // Trigger workflow_dispatch event
        const triggerRes = await fetch(`https://api.github.com/repos/${repoFullName}/actions/workflows/audit.yml/dispatches`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ref: 'main', // or get the default branch
            inputs: {
              make_webhook: 'true'
            }
          }),
        });

        if (!triggerRes.ok) {
          if (triggerRes.status === 404) {
            throw new Error('Audit workflow not found. Please set up the repository first.');
          }
          throw new Error(`Failed to trigger workflow: ${triggerRes.status}`);
        }

        results.push({
          repo: repoFullName,
          success: true,
          triggered: true
        });

      } catch (error) {
        console.error(`Error triggering workflow for ${repoFullName}:`, error);
        errors.push({
          repo: repoFullName,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Log the webhook trigger in database if projectId provided
    if (projectId) {
      try {
        await db.project.update({
          where: { id: projectId },
          data: { updatedAt: new Date() }
        });
      } catch (dbError) {
        console.error('Failed to update project timestamp:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Make.com webhook processed',
      triggered: results.length,
      errorCount: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in Make.com webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// GET endpoint to provide webhook information for Make.com setup
export async function GET() {
  return NextResponse.json({
    webhook_url: '/api/webhooks/makecom',
    method: 'POST',
    required_fields: [
      'repos', // Array of repository full names (e.g., ["GooseyPrime/repo1", "InTellMe/repo2"])
      'token', // GitHub Personal Access Token
      'dashboardToken' // Dashboard API token
    ],
    optional_fields: [
      'projectId' // Project ID for tracking
    ],
    description: 'Webhook endpoint for triggering repository audits via Make.com',
    example_payload: {
      repos: ['GooseyPrime/MyBoss', 'InTellMe/SomeRepo'],
      token: 'ghp_xxxxxxxxxxxx',
      dashboardToken: 'dashboard_token_here',
      projectId: 'optional_project_id'
    }
  });
}