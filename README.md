# Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/GooseyPrime/MyBoss&plugins=postgresql)

## One-command deploy

Click the Railway button above, or run:

```
railway init && railway up
```

## Features
- Next.js dashboard at `/dashboard`
- `/api/ingest` endpoint (POST, Bearer token)
- Postgres client (`lib/db.ts`)
- Types for audit.json (`packages/shared/types/audit.ts`)
- Minimal UI: list projects, latest audit status
- `scripts/run-audit.js` for local/CI audit and ingest
- GitHub Action for push + nightly audit

## Railway services
- Web (Next.js)
- Postgres

## Resource Requests
- Set `DATABASE_URL` (Postgres connection string)
- Set `DASHBOARD_TOKEN` (shared secret for ingest)
- (CI only) Set `INGEST_URL` (API endpoint, e.g. https://myboss.up.railway.app/api/ingest)

## Local dev
```
pnpm install
pnpm dev
```

## DB Schema (suggested)
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL
);
CREATE TABLE repos (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  url TEXT NOT NULL,
  provider TEXT NOT NULL
);
CREATE TABLE audit_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  started_at TIMESTAMP NOT NULL,
  finished_at TIMESTAMP,
  status TEXT NOT NULL
);
CREATE TABLE findings (
  id TEXT PRIMARY KEY,
  audit_run_id TEXT NOT NULL REFERENCES audit_runs(id),
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  file TEXT NOT NULL,
  line INTEGER NOT NULL
);
CREATE TABLE patch_plans (
  id TEXT PRIMARY KEY,
  finding_id TEXT NOT NULL REFERENCES findings(id),
  description TEXT NOT NULL,
  status TEXT NOT NULL
);
```
