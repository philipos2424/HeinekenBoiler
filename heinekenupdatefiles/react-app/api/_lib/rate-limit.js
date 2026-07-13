/**
 * Minimal in-memory per-IP rate limiter. Good enough for a single-instance
 * v1 deploy; swap for Redis/Upstash if this ever runs on multiple instances.
 */
const buckets = new Map();

export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}

export function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}
