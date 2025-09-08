import { NextRequest, NextResponse } from 'next/server';

// Simple token check for /api/ingest
export function checkAuth(authHeader: string | null | undefined, token: string): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  return authHeader.split(' ')[1] === token;
}

export function requireBearer(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const expected = process.env.DASHBOARD_TOKEN;
  if (!auth || !auth.startsWith('Bearer ') || auth.split(' ')[1] !== expected) {
    return { ok: false, res: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  }
  return { ok: true };
}
