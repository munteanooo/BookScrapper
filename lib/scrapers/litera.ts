import * as cheerio from "cheerio"
import type { BookResult, StoreSearchResult } from "./types"
import { absoluteUrl, cleanText, fetchWithTimeout, parsePrice } from "./utils"

const ORIGIN = "https://litera.md"
const STORE = "litera" as const
const STORE_NAME = "Litera"

export function literaSearchUrl(query: string): string {
  return `${ORIGIN}/index.php?route=product/search&search=${encodeURIComponent(query)}`
}

export async function searchLitera(query: string): Promise<StoreSearchResult> {
  const start = Date.now()
  const searchUrl = literaSearchUrl(query)
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

    $(".product-thumb").each((_, el) => {
      const card = $(el)
      const titleLink = card.find(".caption h4 a").first()
      // Textul vizibil este trunchiat ("..."), deci preferăm atributul title.
      const title = cleanText(titleLink.attr("title") || titleLink.text())
      const url = absoluteUrl(titleLink.attr("href") || card.find(".image a").first().attr("href"), ORIGIN)
      if (!title || !url) return

      const author = cleanText(card.find(".author .cursor-d").first().text() || card.find(".author").first().text()) || undefined
      const priceText = cleanText(card.find(".price-abs").first().text() || card.find(".price").first().text()) || undefined

      let image = card.find(".image img").first().attr("src")
      image = image ? absoluteUrl(image, ORIGIN) : undefined

      const outOfStock = card.find(".out-of-stock").length > 0

      results.push({
        store: STORE,
        storeName: STORE_NAME,
        title,
        author,
        priceText,
        price: parsePrice(priceText),
        currency: "MDL",
        stock: outOfStock ? "out_of_stock" : "in_stock",
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
