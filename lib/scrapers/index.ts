import { searchBiblion } from "./biblion"
import { searchCarturesti } from "./carturesti"
import { searchLibrarius } from "./librarius"
import { searchLitera } from "./litera"
import type { AggregatedSearchResponse, StoreSearchResult, StoreId } from "./types"

const SCRAPERS: { fn: (q: string) => Promise<StoreSearchResult>; id: StoreId; name: string }[] = [
  { fn: searchLibrarius, id: "librarius", name: "Librarius" },
  { fn: searchCarturesti, id: "carturesti", name: "Cărturești" },
  { fn: searchLitera, id: "litera", name: "Litera" },
  { fn: searchBiblion, id: "biblion", name: "Biblion" },
]

export async function searchAllStores(query: string): Promise<AggregatedSearchResponse> {
  const trimmed = query.trim()
  if (!trimmed) {
    return { query: trimmed, stores: [], totalResults: 0, warnings: [] }
  }

  const settled = await Promise.allSettled(
    SCRAPERS.map(({ fn }) => fn(trimmed)),
  )

  const warnings: string[] = []
  const stores: StoreSearchResult[] = settled.map((r, i) => {
    if (r.status === "fulfilled") {
      return r.value
    }
    const scraper = SCRAPERS[i]
    const errorMsg = r.reason instanceof Error ? r.reason.message : "Eroare necunoscută"

    // Structured error log
    console.log(
      JSON.stringify({
        scraper: scraper.name,
        error: errorMsg,
        duration: 0,
        timestamp: new Date().toISOString(),
        level: "error",
      }),
    )

    warnings.push(`${scraper.name} indisponibil momentan`)
    return {
      store: scraper.id,
      storeName: scraper.name,
      searchUrl: "",
      ok: false,
      error: errorMsg,
      durationMs: 0,
      results: [],
    }
  })

  const totalResults = stores.reduce((sum, s) => sum + s.results.length, 0)
  return { query: trimmed, stores, totalResults, warnings }
}

export * from "./types"