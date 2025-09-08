// Minimal in-memory rate limiter (LRU by IP)
const WINDOW = 5 * 60 * 1000; // 5 minutes
const LIMIT = 60;
const cache = new Map();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let entry = cache.get(ip);
  if (!entry) {
    entry = { count: 1, first: now };
    cache.set(ip, entry);
    return false;
  }
  if (now - entry.first > WINDOW) {
    entry.count = 1;
    entry.first = now;
    return false;
  }
  entry.count++;
  if (entry.count > LIMIT) return true;
  // LRU: prune if >2000
  if (cache.size > 2000) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].first - b[1].first).slice(0, 100);
    for (const [k] of oldest) cache.delete(k);
  }
  return false;
}
