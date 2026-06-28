import { searchBiblion } from "./biblion"
import { searchCarturesti } from "./carturesti"
import { searchLibrarius } from "./librarius"
import { searchLitera } from "./litera"
import type { AggregatedSearchResponse, StoreSearchResult } from "./types"

const SCRAPERS = [searchLibrarius, searchCarturesti, searchLitera, searchBiblion]

export async function searchAllStores(query: string): Promise<AggregatedSearchResponse> {
  const trimmed = query.trim()
  if (!trimmed) {
    return { query: trimmed, stores: [], totalResults: 0 }
  }

  const settled = await Promise.allSettled(SCRAPERS.map((fn) => fn(trimmed)))

  const stores: StoreSearchResult[] = settled.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : {
          store: "librarius",
          storeName: "Necunoscut",
          searchUrl: "",
          ok: false,
          error: "Scraper eșuat",
          durationMs: 0,
          results: [],
        },
  )

  const totalResults = stores.reduce((sum, s) => sum + s.results.length, 0)
  return { query: trimmed, stores, totalResults }
}

export * from "./types"
