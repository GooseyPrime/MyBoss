interface Finding {
  severity?: string;
  [key: string]: unknown;
}

// Slack notifier util for high-severity findings
export async function notifyFinding(auditRunId: string, findings: Finding[], compliance: unknown) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url || !findings.some(f => f.severity === 'high')) return;
  const highFindings = findings.filter(f => f.severity === 'high');
  const text = `🚨 *High-severity findings detected!*\nAuditRun: ${auditRunId}\nFindings: ${highFindings.length}\nCompliance: ${compliance ? JSON.stringify(compliance) : 'N/A'}`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch {}
}
