export const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "ro-RO,ro;q=0.9,en;q=0.8",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

/** Fetch cu timeout, ca un scraper blocat să nu blocheze toată căutarea. */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 12000,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) },
      cache: "no-store",
    })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Normalizează un text de preț moldovenesc într-un număr.
 * Acceptă formate: "275 lei", "224,90 lei MD", "228.00 MDL", "1.234,50 lei".
 */
export function parsePrice(raw?: string | null): number | undefined {
  if (!raw) return undefined
  // Păstrează doar cifre, virgule, puncte
  const cleaned = raw.replace(/[^\d.,]/g, "").trim()
  if (!cleaned) return undefined

  let normalized = cleaned
  const hasComma = cleaned.includes(",")
  const hasDot = cleaned.includes(".")

  if (hasComma && hasDot) {
    // Ultimul separator este zecimalul (ex: "1.234,50")
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".")
    } else {
      normalized = cleaned.replace(/,/g, "")
    }
  } else if (hasComma) {
    // Virgula este zecimal dacă urmează 1-2 cifre, altfel separator de mii
    normalized = /,\d{1,2}$/.test(cleaned)
      ? cleaned.replace(",", ".")
      : cleaned.replace(/,/g, "")
  }

  const value = Number.parseFloat(normalized)
  return Number.isFinite(value) ? value : undefined
}

export function cleanText(input?: string | null): string {
  return (input || "").replace(/\s+/g, " ").trim()
}

/** Transformă un URL relativ într-unul absolut pe baza originii magazinului. */
export function absoluteUrl(href: string | undefined, origin: string): string {
  if (!href) return origin
  try {
    return new URL(href, origin).toString()
  } catch {
    return origin
  }
}
