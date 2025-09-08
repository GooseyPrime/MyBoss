// Simple token check for /api/ingest
export function checkAuth(authHeader: string | null | undefined, token: string): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  return authHeader.split(' ')[1] === token;
}
