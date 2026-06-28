import * as cheerio from "cheerio"
import type { BookResult, StockStatus, StoreSearchResult } from "./types"
import { absoluteUrl, cleanText, fetchWithTimeout, parsePrice } from "./utils"

const ORIGIN = "https://carturesti.md"
const STORE = "carturesti" as const
const STORE_NAME = "Cărturești"

export function carturestiSearchUrl(query: string): string {
  return `${ORIGIN}/search/${encodeURIComponent(query)}`
}

interface CartProduct {
  name?: string
  price?: string | number
  specialPrice?: string | number
  imgUrl?: string
  url?: string
  subtitle?: string
  stockStatus?: { label?: string; slug?: string }
}

function extractCookies(res: Response): string {
  // undici expune getSetCookie(); fallback la get("set-cookie")
  const raw =
    typeof (res.headers as { getSetCookie?: () => string[] }).getSetCookie === "function"
      ? (res.headers as { getSetCookie: () => string[] }).getSetCookie()
      : res.headers.get("set-cookie")
      ? [res.headers.get("set-cookie") as string]
      : []
  return raw
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ")
}

function authorFromSubtitle(subtitle?: string): string | undefined {
  if (!subtitle) return undefined
  const text = cleanText(cheerio.load(`<div>${subtitle}</div>`)("div").text())
  return text || undefined
}

/**
 * Cărturești.md este o aplicație AngularJS care încarcă produsele printr-un API
 * Solr intern (POST /product/json-search) protejat cu token CSRF. Replicăm exact
 * cererea făcută de site pentru date structurate de înaltă acuratețe.
 */
export async function searchCarturesti(query: string): Promise<StoreSearchResult> {
  const start = Date.now()
  const searchUrl = carturestiSearchUrl(query)
  const base: Omit<StoreSearchResult, "ok" | "results" | "durationMs"> = {
    store: STORE,
    storeName: STORE_NAME,
    searchUrl,
  }

  try {
    // 1. Obținem pagina de căutare pentru token-ul CSRF și cookies.
    const pageRes = await fetchWithTimeout(searchUrl)
    if (!pageRes.ok) throw new Error(`HTTP ${pageRes.status} la pagina de căutare`)
    const pageHtml = await pageRes.text()
    const cookies = extractCookies(pageRes)
    const $ = cheerio.load(pageHtml)
    const csrfToken = $('meta[name="csrf-token"]').attr("content")
    if (!csrfToken) throw new Error("Token CSRF indisponibil")

    // 2. Replicăm cererea Solr a aplicației AngularJS.
    const payload = {
      settings: {
        context: "search",
        contextId: query,
        url: "/product/json-search",
        term: query,
        listName: "Search page",
      },
      attributes: [],
      preferences: [],
      search: {},
    }

    const apiRes = await fetchWithTimeout(`${ORIGIN}/product/json-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        Accept: "application/json, text/plain, */*",
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRF-Token": csrfToken,
        Cookie: cookies,
        Referer: searchUrl,
      },
      body: JSON.stringify(payload),
    })
    if (!apiRes.ok) throw new Error(`HTTP ${apiRes.status} la API-ul de căutare`)

    const data = (await apiRes.json()) as { products?: CartProduct[] }
    const products = Array.isArray(data.products) ? data.products : []

    const results: BookResult[] = products
      .map((p): BookResult | null => {
        const title = cleanText(p.name)
        const url = absoluteUrl(p.url, ORIGIN)
        if (!title || !p.url) return null

        const special = p.specialPrice ? Number(p.specialPrice) : 0
        const regular = p.price ? Number(p.price) : undefined
        const price = special && special > 0 ? special : regular
        const priceText = price != null ? `${price.toFixed(2)} lei` : undefined

        const label = p.stockStatus?.label?.toLowerCase() || ""
        let stock: StockStatus = "unknown"
        if (label.includes("stoc") && !label.includes("fără") && !label.includes("indisponibil"))
          stock = "in_stock"
        else if (label.includes("indisponibil") || label.includes("fără")) stock = "out_of_stock"

        return {
          store: STORE,
          storeName: STORE_NAME,
          title,
          author: authorFromSubtitle(p.subtitle),
          priceText,
          price,
          currency: "MDL",
          stock,
          url,
          image: p.imgUrl ? absoluteUrl(p.imgUrl, ORIGIN) : undefined,
        }
      })
      .filter((r): r is BookResult => r !== null)

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
