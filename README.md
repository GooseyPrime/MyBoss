# MyBoss - Security Audit Dashboard

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/GooseyPrime/MyBoss&plugins=postgresql)

MyBoss is a centralized security audit dashboard that automatically collects, analyzes, and displays security findings from multiple repositories. It provides a unified view of your organization's security posture with automated audit workflows and intelligent patch recommendations.

## Quick Deploy

Click the Railway button above, or run:

```bash
railway init && railway up
```

## Features
- **Next.js Dashboard** at `/dashboard` - Modern web interface for viewing audit results
- **GitHub Repository Setup** - Interactive setup for automated audits of GitHub repositories
- **API Ingest Endpoint** at `/api/ingest` - Secure endpoint for receiving audit data
- **Make.com Integration** - Webhook support for triggering audits via Make.com
- **PostgreSQL Database** - Centralized storage for audit results and metadata
- **Automated Audits** - GitHub Actions integration for continuous security monitoring
- **Multi-Repository Support** - Manage audits across your entire organization
- **Finding Classification** - Severity-based categorization of security issues
- **Patch Planning** - AI-generated recommendations for fixing vulnerabilities

## System Architecture

- **Web Service** - Next.js application (Railway/deployment)
- **Database** - PostgreSQL for persistent storage
- **Audit Engine** - Node.js scripts for security scanning
- **CI/CD Integration** - GitHub Actions for automated workflows

---

# 📋 Operator's Manual

## 🚀 Initial Setup & Deployment

### Environment Variables
Configure these required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/myboss` |
| `DASHBOARD_TOKEN` | Shared secret for API authentication | `your-secure-token-here` |
| `INGEST_URL` | API endpoint for CI integration | `https://myboss.up.railway.app/api/ingest` |

### Railway Deployment
1. Click the Railway deploy button above
2. Configure environment variables in Railway dashboard
3. Database will be automatically provisioned
4. Verify deployment at your Railway URL

### Manual Deployment
```bash
# Clone and setup
git clone https://github.com/GooseyPrime/MyBoss
cd MyBoss
pnpm install

# Configure environment
cp .env.template .env
# Edit .env with your values

# Database setup
pnpm db:migrate
pnpm db:seed

# Build and start
pnpm build
pnpm start
```

## 🔧 Daily Operations

### Monitoring Dashboard
Access your dashboard at `https://your-domain.railway.app/dashboard` to:
- View latest audit results across all repositories
- Monitor security findings by severity level
- Track audit run success/failure rates
- Review patch plan recommendations
- **Set up new GitHub repository audits** - Use the interactive setup tool
- **Configure Make.com webhooks** - Integrate with automation workflows

### Health Checks
Monitor these key metrics:
- **Database Connectivity**: Check PostgreSQL connection status
- **API Endpoint**: Test `/api/ingest` responds to authenticated requests
- **Audit Frequency**: Ensure repositories are running scheduled audits
- **Finding Trends**: Watch for increases in high-severity findings

### Log Monitoring
Check application logs for:
```bash
# Successful audit ingestion
"Ingest response: 200"

# Authentication failures
"Unauthorized access attempt"

# Database connection issues
"Database connection failed"
```

## 🔐 Security Operations

### Token Management
The `DASHBOARD_TOKEN` secures the `/api/ingest` endpoint:

1. **Rotation Schedule**: Rotate tokens quarterly
2. **Update Process**:
   ```bash
   # Generate new token
   openssl rand -base64 32
   
   # Update in Railway dashboard
   # Update GitHub Secrets in all repositories
   ```
3. **Emergency Rotation**: If compromised, rotate immediately

### Access Control
- Dashboard access is not authenticated by default
- Consider adding authentication for production deployments
- Audit database access should be restricted to application only

### Secrets Management
Repository secrets required for each audited repo:
- `DASHBOARD_TOKEN`: For API authentication
- `INGEST_URL`: Your MyBoss API endpoint

## 🔍 Audit Management

### Understanding Findings
Findings are categorized by severity:
- **Critical**: Immediate action required (RCE, data exposure)
- **High**: Security vulnerabilities requiring prompt attention
- **Medium**: Security weaknesses to address in next cycle
- **Low**: Best practice improvements

### Responding to Findings
1. **Triage**: Review findings in dashboard by severity
2. **Investigate**: Examine file references and line numbers
3. **Apply Patches**: Use generated patch plans as guidance
4. **Verify**: Re-run audits to confirm fixes
5. **Document**: Track remediation in your security system

### Audit Frequency
- **Push Events**: Audits run on every push to main branch
- **Scheduled**: Daily audits at 3:00 AM UTC via cron
- **Manual**: Run `pnpm exec tsx scripts/run-audit.js` locally

## 🏗️ Repository Management

### Adding New Repositories
You can now use the dashboard interface to add audit workflows to new repositories:

1. **Dashboard Method** (Recommended):
   - Go to `/dashboard` in your MyBoss application
   - Use the "GitHub Repository Audit Setup" section
   - Enter your GitHub Personal Access Token (requires `repo` and `workflow` scopes)
   - Select repositories from GooseyPrime and InTellMe organizations
   - Click "Setup Audits" to automatically configure workflows and secrets

2. **Script Method** (Legacy):
   ```bash
   # Set environment variables
   export GITHUB_TOKEN="your-github-pat"
   export DASHBOARD_TOKEN="your-dashboard-token"
   
   # Run setup script (prompts if env vars not set)
   node scripts/setup-audit-workflows.js
   ```

The dashboard method provides a better user experience with:
- Token security (stored locally with expiration)
- Real-time repository selection
- Visual feedback and error handling
- Integration with Make.com webhooks

For detailed setup instructions, see [GITHUB_AUDIT_SETUP.md](./GITHUB_AUDIT_SETUP.md).

This script will:
1. Add `.github/workflows/audit.yml` to each repository
2. Configure required GitHub secrets
3. Enable automated auditing

### Repository Requirements
Each audited repository needs:
- Node.js 20+ environment
- `pnpm` package manager
- `scripts/run-audit.js` file
- GitHub Actions enabled

### Excluding Repositories
The setup script automatically skips repositories containing "dashboard" in the name. Modify the script to exclude additional repositories as needed.

## 🛠️ Troubleshooting

### Common Issues

#### Audit Failures
**Symptom**: Repositories showing failed audit status
**Solutions**:
1. Check GitHub Actions logs in the repository
2. Verify Node.js and pnpm versions match requirements
3. Ensure `scripts/run-audit.js` exists and is executable
4. Check network connectivity to dashboard API

#### API Ingestion Errors
**Symptom**: Audits run but data doesn't appear in dashboard
**Solutions**:
1. Verify `DASHBOARD_TOKEN` matches in both places
2. Check `INGEST_URL` points to correct endpoint
3. Review API logs for authentication errors
4. Validate audit.json format against schema

#### Database Connection Issues
**Symptom**: Dashboard shows connection errors
**Solutions**:
1. Verify `DATABASE_URL` format and credentials
2. Check PostgreSQL service status in Railway
3. Run database migrations: `pnpm db:migrate`
4. Test connection with: `pnpm exec prisma db pull`

#### Missing Dependencies
**Symptom**: Build or runtime errors
**Solutions**:
```bash
# Reset and reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Regenerate Prisma client
pnpm exec prisma generate
```

### Performance Issues
- **Database Growth**: Monitor finding and audit_run table sizes
- **API Rate Limits**: GitHub API calls are limited by token
- **Memory Usage**: Watch Next.js application memory consumption

## 🔄 System Maintenance

### Database Maintenance
```bash
# View database statistics
pnpm exec prisma db pull

# Clean old audit runs (older than 90 days)
# Run this query in your database client:
DELETE FROM audit_runs WHERE started_at < NOW() - INTERVAL '90 days';

# Optimize database performance
VACUUM ANALYZE;
```

### Backup Procedures
1. **Database Backups**: Railway provides automatic backups
2. **Manual Backup**:
   ```bash
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```
3. **Configuration Backup**: Export environment variables securely

### Updates & Upgrades
```bash
# Update dependencies
pnpm update

# Update database schema
pnpm db:migrate

# Update Railway deployment
git push origin main
```

### Monitoring & Alerts
Set up monitoring for:
- Audit run failures across repositories
- High/critical findings that require immediate attention
- Database performance and storage usage
- API response time and error rates

## 📊 Scaling Operations

### Adding Team Members
1. Provide dashboard URL access
2. Share documentation and runbooks
3. Grant necessary GitHub repository permissions
4. Configure notification preferences

### Multi-Organization Support
- Deploy separate MyBoss instances per organization
- Or modify scripts to support multiple GitHub organizations
- Ensure proper token scoping for cross-org access

### Performance Optimization
- Consider database indexing for large datasets
- Implement audit result caching for frequently accessed data
- Set up CDN for dashboard static assets

---

## 🧑‍💻 Local Development

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.template .env
# Configure your local database and tokens

# Run database migrations
pnpm db:migrate

# Seed with sample data (optional)
pnpm db:seed

# Start development server
pnpm dev
```

Access the development server at `http://localhost:3000`

### Testing Audit Ingestion
```bash
# Run a test audit locally
pnpm exec tsx scripts/run-audit.js

# This will:
# 1. Generate a sample audit.json
# 2. POST it to your local/configured ingest endpoint
# 3. Display the API response
```

## 📋 Database Schema

The system uses PostgreSQL with the following core tables:

```sql
-- Projects represent organizations or major initiatives
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  provider TEXT,
  url TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Repositories within projects
CREATE TABLE repos (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  full_name TEXT UNIQUE NOT NULL,
  default_branch TEXT,
  type TEXT,
  url TEXT,
  provider TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Individual audit runs per repository
CREATE TABLE audit_runs (
  id TEXT PRIMARY KEY,
  repo_id TEXT NOT NULL REFERENCES repos(id),
  commit_sha TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  finished_at TIMESTAMP,
  raw_json JSONB
);

-- Security findings from audits
CREATE TABLE findings (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL REFERENCES audit_runs(id),
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL,
  file_refs TEXT[] NOT NULL,
  detail JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL
);

-- Suggested patches for findings
CREATE TABLE patch_plans (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL REFERENCES audit_runs(id),
  rank INTEGER NOT NULL,
  why TEXT NOT NULL,
  files TEXT[] NOT NULL,
  diff TEXT NOT NULL,
  rollback TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL
);
```

## 🔗 API Reference

### POST /api/ingest
Ingest audit results from CI/CD systems.

**Headers:**
```
Authorization: Bearer <DASHBOARD_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "project": {
    "id": "project-id",
    "name": "Project Name",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "repos": [{
    "id": "repo-id",
    "project_id": "project-id",
    "url": "https://github.com/org/repo",
    "provider": "github"
  }],
  "audit_run": {
    "id": "unique-run-id",
    "project_id": "project-id",
    "started_at": "2024-01-01T00:00:00Z",
    "finished_at": "2024-01-01T00:05:00Z",
    "status": "success"
  },
  "findings": [{
    "id": "finding-id",
    "audit_run_id": "unique-run-id",
    "type": "vulnerability",
    "severity": "high",
    "message": "SQL injection vulnerability",
    "file": "src/db.js",
    "line": 42
  }],
  "patch_plans": [{
    "id": "patch-id",
    "finding_id": "finding-id",
    "description": "Use parameterized queries",
    "status": "open"
  }]
}
```

**Response:**
```json
{
  "ok": true,
  "audit_run_id": "unique-run-id"
}
```

### POST /api/github/repos
Fetch GitHub repositories for GooseyPrime and InTellMe organizations.

**Request Body:**
```json
{
  "token": "ghp_your_github_personal_access_token"
}
```

**Response:**
```json
{
  "repos": [
    {
      "id": 123456789,
      "name": "MyBoss",
      "full_name": "GooseyPrime/MyBoss",
      "default_branch": "main",
      "private": false,
      "description": "Security audit dashboard"
    }
  ],
  "count": 1
}
```

### POST /api/github/audit
Set up GitHub Actions workflows for selected repositories.

**Request Body:**
```json
{
  "repos": [
    {
      "id": 123456789,
      "name": "MyBoss",
      "full_name": "GooseyPrime/MyBoss",
      "default_branch": "main",
      "private": false
    }
  ],
  "token": "ghp_your_github_personal_access_token",
  "dashboardToken": "your_dashboard_api_token"
}
```

**Response:**
```json
{
  "success": true,
  "project": {
    "id": "project-id",
    "name": "GitHub Audit 2025-01-27",
    "slug": "github-audit-1738012345"
  },
  "setupCount": 1,
  "errorCount": 0,
  "results": [
    {
      "repo": "GooseyPrime/MyBoss",
      "success": true,
      "workflowUrl": "https://github.com/GooseyPrime/MyBoss/actions/workflows/audit.yml"
    }
  ]
}
```

### POST /api/webhooks/makecom
Trigger audit workflows via Make.com webhook.

**Request Body:**
```json
{
  "repos": ["GooseyPrime/MyBoss", "InTellMe/SomeRepo"],
  "token": "ghp_your_github_personal_access_token",
  "dashboardToken": "your_dashboard_api_token",
  "projectId": "optional_project_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Make.com webhook processed",
  "triggered": 2,
  "errorCount": 0,
  "results": [
    {
      "repo": "GooseyPrime/MyBoss",
      "success": true,
      "triggered": true
    }
  ]
}
```

### GET /api/webhooks/makecom
Get webhook documentation and configuration details for Make.com integration.

## 🔧 Configuration

### Railway Services
The `railway.json` configuration defines:
- **Web Service**: Next.js application with build and start commands
- **PostgreSQL**: Database service with starter plan
- **Environment Variables**: Required configuration for deployment

### GitHub Actions
Each monitored repository needs an `audit.yml` workflow:
- Triggers on push to main branch and daily at 3 AM
- Installs dependencies and runs audit script
- Uploads audit.json as artifact
- Posts results to dashboard API

---

## 📞 Support & Contributing

### Getting Help
1. Check the troubleshooting section above
2. Review GitHub Actions logs for audit failures
3. Check Railway application logs for runtime issues
4. Open an issue in this repository for bugs or feature requests

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

### Security
Report security vulnerabilities privately to the repository maintainers.

---

**Updated:** 2025-01-27T12:00:00-05:00 / 2025-01-27T17:00:00Z — Added comprehensive operator's manual
