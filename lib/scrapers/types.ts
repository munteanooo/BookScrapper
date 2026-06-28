export type StoreId = "librarius" | "carturesti" | "litera" | "biblion"

export type StockStatus = "in_stock" | "out_of_stock" | "unknown"

export interface BookResult {
  /** Magazinul sursă */
  store: StoreId
  storeName: string
  /** Titlul cărții așa cum apare pe site */
  title: string
  /** Autor, dacă este disponibil */
  author?: string
  /** Prețul brut afișat pe site, ex: "275 lei" */
  priceText?: string
  /** Prețul normalizat în MDL pentru sortare/comparare */
  price?: number
  currency: string
  stock: StockStatus
  /** Link direct către pagina produsului */
  url: string
  /** Imaginea copertei */
  image?: string
}

export interface StoreSearchResult {
  store: StoreId
  storeName: string
  /** URL-ul paginii de căutare a magazinului pentru titlul cerut */
  searchUrl: string
  ok: boolean
  error?: string
  durationMs: number
  results: BookResult[]
}

export interface AggregatedSearchResponse {
  query: string
  stores: StoreSearchResult[]
  totalResults: number
}

export const STORE_META: Record<StoreId, { name: string; origin: string }> = {
  librarius: { name: "Librarius", origin: "https://librarius.md" },
  carturesti: { name: "Cărturești", origin: "https://carturesti.md" },
  litera: { name: "Litera", origin: "https://litera.md" },
  biblion: { name: "Biblion", origin: "https://biblion.md" },
}
