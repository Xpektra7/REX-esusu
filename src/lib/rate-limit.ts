// In-memory sliding-window rate limiter.
//
// NOTE: this is per-process only — it resets on server restart and does not
// coordinate across serverless instances. For production with multiple
// instances, swap the Map for a shared store (Upstash/Redis). The API surface
// below is intentionally small so that swap is localized to this file.

const requestLogs = new Map<string, number[]>();

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

export function rateLimit(
  options: { windowMs?: number; maxRequests?: number } = {},
) {
  const { windowMs = 60_000, maxRequests = 20 } = options;

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const windowStart = now - windowMs;

      let timestamps = requestLogs.get(key) ?? [];
      timestamps = timestamps.filter((t) => t > windowStart);

      if (timestamps.length >= maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetIn: timestamps[0] + windowMs - now,
        };
      }

      timestamps.push(now);
      requestLogs.set(key, timestamps);

      return {
        allowed: true,
        remaining: maxRequests - timestamps.length,
        resetIn: windowMs,
      };
    },
  };
}
