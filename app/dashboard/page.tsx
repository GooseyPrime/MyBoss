import { query } from '../../lib/db';
import Link from 'next/link';

// Disable static rendering for this page since it needs database access
export const dynamic = 'force-dynamic';

interface ProjectRow {
  id: string;
  name: string;
  last_audit_status: string;
  last_audit_at: string;
}

export default async function DashboardPage() {
  const { rows } = await query(
    `SELECT p.id, p.name, ar.status as last_audit_status, ar.finished_at as last_audit_at
     FROM projects p
     LEFT JOIN LATERAL (
       SELECT * FROM audit_runs ar2 WHERE ar2.project_id = p.id ORDER BY ar2.finished_at DESC LIMIT 1
     ) ar ON true
     ORDER BY p.name`
  );

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Last Audit</th>
            <th className="border px-2 py-1">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p: ProjectRow) => (
            <tr key={p.id}>
              <td className="border px-2 py-1">
                <Link href={`#`}>{p.name}</Link>
              </td>
              <td className="border px-2 py-1">{p.last_audit_at ? new Date(p.last_audit_at).toLocaleString() : 'Never'}</td>
              <td className="border px-2 py-1">{p.last_audit_status || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
