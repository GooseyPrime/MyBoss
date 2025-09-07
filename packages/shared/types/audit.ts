// Normalized audit types for ingestion and DB schema

export interface Project {
  id: string;
  name: string;
  created_at: string;
}

export interface Repo {
  id: string;
  project_id: string;
  url: string;
  provider: string;
}

export interface AuditRun {
  id: string;
  project_id: string;
  started_at: string;
  finished_at: string | null;
  status: 'pending' | 'success' | 'failed';
}

export interface Finding {
  id: string;
  audit_run_id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  file: string;
  line: number;
}

export interface PatchPlan {
  id: string;
  finding_id: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
}

export interface AuditJson {
  project: Project;
  repos: Repo[];
  audit_run: AuditRun;
  findings: Finding[];
  patch_plans: PatchPlan[];
}
