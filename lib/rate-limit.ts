import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

let ratelimit: Ratelimit | null = null

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) {
    ratelimit = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(10, "60 s"), // max 10 requests per 60s
      analytics: true,
      prefix: "ratelimit:search",
    })
  }
  return ratelimit
}

export interface RateLimitResult {
  allowed: boolean
  retryAfter: number
}

export async function checkRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  const rl = getRatelimit()
  if (!rl) {
    // If Redis is not configured, allow all requests
    return { allowed: true, retryAfter: 0 }
  }

  const { success, reset } = await rl.limit(identifier)
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))

  return { allowed: success, retryAfter }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  return request.headers.get("x-real-ip") || "127.0.0.1"
}