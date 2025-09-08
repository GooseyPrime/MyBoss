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
- `scripts/run-audit.ts` for local/CI audit and ingest
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

<<<<<<< HEAD
=======
To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

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
- `scripts/run-audit.ts` for local/CI audit and ingest
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

>>>>>>> 88809cf (feat: scaffold Next.js dashboard, API ingest, Postgres client, audit types, minimal UI, Railway/CI files)
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
