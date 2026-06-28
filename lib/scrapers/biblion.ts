import * as cheerio from "cheerio"
import type { BookResult, StockStatus, StoreSearchResult } from "./types"
import { absoluteUrl, cleanText, fetchWithTimeout, parsePrice } from "./utils"

const ORIGIN = "https://biblion.md"
const STORE = "biblion" as const
const STORE_NAME = "Biblion"

export function biblionSearchUrl(query: string): string {
  return `${ORIGIN}/?s=${encodeURIComponent(query)}&post_type=product`
}

export async function searchBiblion(query: string): Promise<StoreSearchResult> {
  const start = Date.now()
  const searchUrl = biblionSearchUrl(query)
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

    $("li.product").each((_, el) => {
      const card = $(el)
      const link = card.find("a.woocommerce-LoopProduct-link[href]").first()
      const url = absoluteUrl(link.attr("href"), ORIGIN)
      const title = cleanText(card.find(".woocommerce-loop-product__title").first().text())
      if (!title || !url) return

      const priceText = cleanText(card.find(".woocommerce-Price-amount").first().text()) || undefined

      // Imaginile sunt lazy-loaded: preferăm data-src.
      const img = card.find("img").first()
      let image = img.attr("data-src") || img.attr("src")
      image = image && !image.includes("placeholder") ? absoluteUrl(image, ORIGIN) : undefined

      const classes = card.attr("class") || ""
      let stock: StockStatus = "unknown"
      if (classes.includes("outofstock")) stock = "out_of_stock"
      else if (classes.includes("instock")) stock = "in_stock"

      results.push({
        store: STORE,
        storeName: STORE_NAME,
        title,
        priceText,
        price: parsePrice(priceText),
        currency: "MDL",
        stock,
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
