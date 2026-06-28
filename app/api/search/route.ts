import { type NextRequest, NextResponse } from "next/server"
import { searchAllStores } from "@/lib/scrapers"
import { getFromCache, setToCache, normalizeQuery } from "@/lib/cache"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import type { AggregatedSearchResponse } from "@/lib/scrapers/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const start = Date.now()
  const rawQuery = request.nextUrl.searchParams.get("q") || ""
  const query = normalizeQuery(rawQuery)

  if (!query) {
    return NextResponse.json({ query: "", stores: [], totalResults: 0, warnings: [] })
  }

  // --- Rate limiting ---
  const ip = getClientIp(request)
  const { allowed, retryAfter } = await checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      },
    )
  }

  // --- Cache lookup ---
  const cacheKey = `search:${query}`
  const cached = await getFromCache<AggregatedSearchResponse>(cacheKey)
  if (cached) {
    const duration = Date.now() - start
    logSearch(query, cached.totalResults, duration, true, cached.warnings || [])
    return NextResponse.json(cached, {
      headers: {
        "X-Cache": "HIT",
        "X-Cache-Age": "cached",
      },
    })
  }

  // --- Scrape ---
  try {
    const data = await searchAllStores(query)
    const duration = Date.now() - start

    // Cache the result (only if we got at least one successful store)
    if (data.stores.some((s) => s.ok)) {
      await setToCache(cacheKey, data, 3600)
    }

    logSearch(query, data.totalResults, duration, false, data.warnings || [])

    return NextResponse.json(data, {
      headers: { "X-Cache": "MISS" },
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Eroare la căutare"
    console.log(
      JSON.stringify({
        query,
        error: errorMessage,
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
        level: "error",
      }),
    )
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    )
  }
}

function logSearch(
  query: string,
  resultsCount: number,
  duration: number,
  cacheHit: boolean,
  scraperErrors: string[],
) {
  console.log(
    JSON.stringify({
      query,
      resultsCount,
      duration,
      cacheHit,
      timestamp: new Date().toISOString(),
      scraperErrors: scraperErrors.length > 0 ? scraperErrors : undefined,
      level: "info",
    }),
  )
}