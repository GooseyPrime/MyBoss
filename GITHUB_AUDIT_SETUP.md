# GitHub Repository Audit Setup Guide

This guide explains how to use the MyBoss dashboard to set up automated GitHub repository audits with Make.com integration.

## Overview

The MyBoss dashboard allows you to:
- Select GitHub repositories from GooseyPrime and InTellMe organizations
- Automatically set up GitHub Actions workflows for security auditing
- Integrate with Make.com for webhook-triggered audits
- View audit results and findings in the dashboard

## Prerequisites

### GitHub Personal Access Token

You need a GitHub Personal Access Token with the following scopes:
- `repo` - Full access to repositories (required for creating workflows and managing secrets)
- `workflow` - Update GitHub Action workflows

To create a token:
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select the required scopes: `repo` and `workflow`
4. Generate and copy the token (starts with `ghp_`)

### Dashboard API Token

For the audit workflows to report back to the dashboard, you need a dashboard token. For development, you can use any string like `"dev-token"`.

## Setup Process

### 1. Access the Dashboard

Navigate to the dashboard at `/dashboard` in your MyBoss application.

### 2. GitHub Repository Selection

1. **Enter GitHub Token**: Paste your GitHub Personal Access Token in the token field
2. **Remember Token** (Optional): Check the box to securely store the token for 24 hours
3. **Fetch Repositories**: Click the button to load repositories from GooseyPrime and InTellMe organizations
4. **Select Repositories**: Choose which repositories you want to audit
5. **Setup Audits**: Click the setup button to configure the selected repositories

### 3. What Happens During Setup

For each selected repository, the system will:
- Validate access to the repository
- Create/update a `.github/workflows/audit.yml` workflow file
- Set up repository secrets (`DASHBOARD_API` and `DASHBOARD_TOKEN`)
- Create a database record for tracking audit runs

### 4. Verify Setup

After setup is complete:
1. Check the selected repositories on GitHub
2. Verify that the workflow file exists at `.github/workflows/audit.yml`
3. Confirm that repository secrets are configured in Settings → Secrets and variables → Actions

## Make.com Integration

### Webhook Endpoint

The Make.com webhook is available at: `/api/webhooks/makecom`

### Webhook Payload

```json
{
  "repos": ["GooseyPrime/MyBoss", "InTellMe/SomeRepo"],
  "token": "ghp_your_github_token",
  "dashboardToken": "your_dashboard_token",
  "projectId": "optional_project_id"
}
```

### Required Fields
- `repos`: Array of repository full names (e.g., "owner/repo")
- `token`: GitHub Personal Access Token
- `dashboardToken`: Dashboard API token

### Optional Fields
- `projectId`: Project ID for tracking (if you have one)

### Setting up Make.com

1. Create a new scenario in Make.com
2. Add a webhook module and copy the webhook URL
3. Configure the webhook to send POST requests to `/api/webhooks/makecom`
4. Include the required payload fields
5. Test the webhook to trigger repository audits

## Audit Workflow

The created GitHub Actions workflow (`audit.yml`) will:
- Run on every push to the main branch
- Run daily at 3:37 AM UTC (scheduled)
- Can be triggered manually via workflow_dispatch
- Can be triggered via the Make.com webhook

The workflow:
1. Checks out the repository code
2. Sets up Node.js environment
3. Installs dependencies using pnpm
4. Runs the audit script (`scripts/run-audit.ts`)
5. Uploads audit results as artifacts
6. Reports results back to the dashboard API

## Troubleshooting

### Common Issues

**"Invalid GitHub token or insufficient permissions"**
- Ensure your token has `repo` and `workflow` scopes
- Verify the token hasn't expired
- Check that you have access to the repositories

**"Failed to create workflow"**
- Ensure you have write access to the repository
- Check that the repository allows GitHub Actions
- Verify the `workflow` scope is enabled on your token

**"Access denied to repository"**
- Ensure you're a member of the organization
- Check repository permissions
- Verify the repository exists and is accessible

**"Dashboard token is required"**
- Enter a dashboard token when prompted
- For development, any string like "dev-token" will work
- For production, use the actual dashboard API token

### Token Security

- Tokens are stored locally in browser localStorage with expiration
- Tokens are cleared automatically after 24 hours
- Clear the "Remember token" checkbox to avoid storing tokens
- Never share your GitHub tokens with others

### Workflow Permissions

If workflows fail to run:
1. Go to repository Settings → Actions → General
2. Ensure "Allow all actions and reusable workflows" is selected
3. Under "Workflow permissions", select "Read and write permissions"
4. Save changes and re-run the workflow

## API Endpoints

### GitHub Repository Fetching
- **Endpoint**: `/api/github/repos`
- **Method**: POST
- **Body**: `{ "token": "your_github_token" }`

### Audit Setup
- **Endpoint**: `/api/github/audit`  
- **Method**: POST
- **Body**: `{ "repos": [...], "token": "...", "dashboardToken": "..." }`

### Make.com Webhook
- **Endpoint**: `/api/webhooks/makecom`
- **Method**: POST / GET (GET returns documentation)
- **Body**: `{ "repos": [...], "token": "...", "dashboardToken": "..." }`

## Security Considerations

- GitHub tokens are not stored server-side
- Client-side token storage uses localStorage with expiration
- Repository secrets are encrypted using GitHub's public key system
- Audit results are transmitted securely to the dashboard API
- Always use tokens with minimal required permissions

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify GitHub token permissions and expiration
3. Ensure repository access and Actions permissions
4. Review the workflow run logs on GitHub
5. Check that the dashboard API is accessible