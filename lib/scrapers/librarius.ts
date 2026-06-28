import * as cheerio from "cheerio"
import type { BookResult, StoreSearchResult } from "./types"
import { absoluteUrl, cleanText, fetchWithTimeout, parsePrice } from "./utils"

const ORIGIN = "https://librarius.md"
const STORE = "librarius" as const
const STORE_NAME = "Librarius"

export function librariusSearchUrl(query: string): string {
  return `${ORIGIN}/ro/search?search=${encodeURIComponent(query)}`
}

export async function searchLibrarius(query: string): Promise<StoreSearchResult> {
  const start = Date.now()
  const searchUrl = librariusSearchUrl(query)
  const base: Omit<StoreSearchResult, "ok" | "results" | "durationMs"> = {
    store: STORE,
    storeName: STORE_NAME,
    searchUrl,
  }

  try {
    const res = await fetchWithTimeout(searchUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()
    const $ = cheerio.load(html)
    const results: BookResult[] = []

    $(".anyproduct-card").each((_, el) => {
      const card = $(el)
      const link = card.find("a[href]").first()
      const url = absoluteUrl(link.attr("href"), ORIGIN)
      const title = cleanText(card.find(".card-title").first().text())
      if (!title || !url) return

      const author = cleanText(card.find(".search-card-info-label").first().text()) || undefined
      const priceText = cleanText(card.find(".card-price").first().text()) || undefined

      let image = card.find(".product-image img").first().attr("src")
      image = image ? absoluteUrl(image, ORIGIN) : undefined

      // Dacă există butonul "Cumpără", produsul este disponibil.
      const hasBuy = card.find(".add-to-cart-button").length > 0

      results.push({
        store: STORE,
        storeName: STORE_NAME,
        title,
        author,
        priceText,
        price: parsePrice(priceText),
        currency: "MDL",
        stock: hasBuy ? "in_stock" : "unknown",
        url,
        image,
      })
    })

    return { ...base, ok: true, results, durationMs: Date.now() - start }
  } catch (err) {
    return {
      ...base,
      ok: false,
      error: err instanceof Error ? err.message : "Eroare necunoscută",
      results: [],
      durationMs: Date.now() - start,
    }
  }
}
