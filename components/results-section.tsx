"use client"

import { AlertTriangle, ArrowUpRight, CheckCircle2, TrendingDown } from "lucide-react"
import { useMemo, useState } from "react"
import type { AggregatedSearchResponse, BookResult, StoreSearchResult } from "@/lib/scrapers/types"
import { BookCard } from "@/components/book-card"

type SortKey = "price-asc" | "price-desc" | "store"

function StoreStatus({ store }: { store: StoreSearchResult }) {
  return (
    <a
      href={store.searchUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm transition-colors hover:border-primary/50"
    >
      <div className="flex items-center gap-2">
        {store.ok ? (
          <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
        ) : (
          <AlertTriangle className="size-4 text-destructive" aria-hidden="true" />
        )}
        <span className="font-medium text-card-foreground">{store.storeName}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {store.ok ? `${store.results.length} rezultate` : "indisponibil"}
        </span>
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </div>
    </a>
  )
}

export function ResultsSection({ data }: { data: AggregatedSearchResponse }) {
  const [sort, setSort] = useState<SortKey>("price-asc")
  const [inStockOnly, setInStockOnly] = useState(false)
  const [activeStore, setActiveStore] = useState<string | null>(null)

  const allResults = useMemo(
    () => data.stores.flatMap((s) => s.results),
    [data.stores],
  )

  const filtered = useMemo(() => {
    let list = [...allResults]
    if (inStockOnly) list = list.filter((b) => b.stock === "in_stock")
    if (activeStore) list = list.filter((b) => b.store === activeStore)

    list.sort((a, b) => {
      if (sort === "store") return a.storeName.localeCompare(b.storeName)
      const pa = a.price ?? Number.POSITIVE_INFINITY
      const pb = b.price ?? Number.POSITIVE_INFINITY
      return sort === "price-asc" ? pa - pb : pb - pa
    })
    return list
  }, [allResults, inStockOnly, activeStore, sort])

  // Cea mai bună ofertă: cel mai mic preț disponibil în stoc.
  const bestDeal = useMemo<BookResult | undefined>(() => {
    const candidates = allResults.filter((b) => b.price != null && b.stock !== "out_of_stock")
    if (candidates.length === 0) return undefined
    return candidates.reduce((min, b) => ((b.price ?? Infinity) < (min.price ?? Infinity) ? b : min))
  }, [allResults])

  if (data.totalResults === 0) {
    const anyOk = data.stores.some((s) => s.ok)
    return (
      <div className="mt-10 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
        <p className="font-heading text-lg font-semibold text-foreground">
          Niciun rezultat pentru „{data.query}”
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {anyOk
            ? "Încearcă un alt titlu sau verifică ortografia. Poți căuta și după autor."
            : "Magazinele nu au putut fi accesate momentan. Încearcă din nou peste câteva momente."}
        </p>
        <div className="mx-auto mt-5 grid max-w-md gap-2">
          {data.stores.map((s) => (
            <StoreStatus key={s.store} store={s} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      {/* Cea mai bună ofertă */}
      {bestDeal && (
        <div className="flex flex-col gap-4 rounded-2xl border border-success/30 bg-success/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/15">
              <TrendingDown className="size-5 text-success" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-success">
                Cea mai bună ofertă în stoc
              </p>
              <p className="mt-0.5 line-clamp-1 font-heading text-base font-semibold text-foreground">
                {bestDeal.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {bestDeal.storeName} ·{" "}
                <span className="font-semibold text-foreground">
                  {bestDeal.price?.toLocaleString("ro-MD", { minimumFractionDigits: 2 })} MDL
                </span>
              </p>
            </div>
          </div>
          <a
            href={bestDeal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-success px-4 py-2.5 text-sm font-semibold text-success-foreground transition-opacity hover:opacity-90"
          >
            Vezi oferta
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </div>
      )}

      {/* Status per magazin */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {data.stores.map((s) => (
          <StoreStatus key={s.store} store={s} />
        ))}
      </div>

      {/* Controale */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveStore(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeStore === null
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            Toate ({allResults.length})
          </button>
          {data.stores
            .filter((s) => s.results.length > 0)
            .map((s) => (
              <button
                key={s.store}
                onClick={() => setActiveStore(s.store)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeStore === s.store
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {s.storeName} ({s.results.length})
              </button>
            ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="size-3.5 accent-[var(--primary)]"
            />
            Doar în stoc
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sortează rezultatele"
            className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="price-asc">Preț crescător</option>
            <option value="price-desc">Preț descrescător</option>
            <option value="store">După magazin</option>
          </select>
        </div>
      </div>

      {/* Grilă rezultate */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Niciun rezultat cu filtrele selectate.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((book, i) => (
            <BookCard
              key={`${book.store}-${i}-${book.url}`}
              book={book}
              isCheapest={bestDeal?.url === book.url}
            />
          ))}
        </div>
      )}
    </div>
  )
}
