import { Redis } from "@upstash/redis"

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) {
    redis = new Redis({ url, token })
  }
  return redis
}

export function isCacheConnected(): boolean {
  return getRedis() !== null
}

export async function getFromCache<T>(key: string): Promise<T | null> {
  const client = getRedis()
  if (!client) return null
  try {
    return await client.get<T>(key)
  } catch {
    return null
  }
}

export async function setToCache<T>(
  key: string,
  value: T,
  ttlSeconds = 3600,
): Promise<void> {
  const client = getRedis()
  if (!client) return
  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value))
  } catch {
    // Cache write failures are non-critical
  }
}

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase()
}