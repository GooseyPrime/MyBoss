// Normalized audit types for ingestion and DB schema

import { z } from 'zod';

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

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
});

export const RepoSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  url: z.string(),
  provider: z.string(),
});

export const AuditRunSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  started_at: z.string(),
  finished_at: z.string().nullable(),
  status: z.enum(['pending', 'success', 'failed']),
});

export const FindingSchema = z.object({
  id: z.string(),
  audit_run_id: z.string(),
  type: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string(),
  file: z.string(),
  line: z.number(),
});

export const PatchPlanSchema = z.object({
  id: z.string(),
  finding_id: z.string(),
  description: z.string(),
  status: z.enum(['open', 'in_progress', 'closed']),
});

export const AuditSchema = z.object({
  project: ProjectSchema,
  repos: z.array(RepoSchema),
  audit_run: AuditRunSchema,
  findings: z.array(FindingSchema),
  patch_plans: z.array(PatchPlanSchema),
});
