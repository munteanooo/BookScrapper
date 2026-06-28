"use client"

import { AlertTriangle, Loader2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import useSWR from "swr"
import { ResultsSection } from "@/components/results-section"
import { SearchBar } from "@/components/search-bar"
import type { AggregatedSearchResponse } from "@/lib/scrapers/types"

const fetcher = async (url: string): Promise<AggregatedSearchResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Căutarea a eșuat. Încearcă din nou.")
  return res.json()
}

const STORE_NAMES = ["Librarius", "Cărturești", "Litera", "Biblion"]

function SkeletonCard() {
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-4 animate-pulse">
      <div className="h-28 w-20 shrink-0 rounded-md bg-muted" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-5 w-full rounded bg-muted" />
        <div className="h-3 w-32 rounded bg-muted" />
        <div className="mt-auto flex items-end justify-between">
          <div className="h-6 w-20 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "acum câteva secunde"
  const minutes = Math.floor(seconds / 60)
  if (minutes === 1) return "acum 1 minut"
  return `acum ${minutes} minute`
}

export function BookSearch() {
  const [submitted, setSubmitted] = useState("")
  const [cachedAt, setCachedAt] = useState<Date | null>(null)
  const [showRefreshBanner, setShowRefreshBanner] = useState(false)
  const prevSubmitted = useRef("")

  const { data, error, isLoading, isValidating } = useSWR(
    submitted ? `/api/search?q=${encodeURIComponent(submitted)}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  )

  // Show refresh banner when re-fetching with existing data
  useEffect(() => {
    if (isValidating && data) {
      setShowRefreshBanner(true)
    } else {
      setShowRefreshBanner(false)
    }
  }, [isValidating, data])

  // Update cachedAt when new data arrives
  useEffect(() => {
    if (data && !isValidating) {
      setCachedAt(new Date())
    }
  }, [data, isValidating])

  const handleSearch = (query: string) => {
    prevSubmitted.current = submitted
    setSubmitted(query)
  }

  const isFirstLoad = isLoading && !data
  const isRefreshing = isValidating && data

  return (
    <div className="flex flex-col gap-2">
      <SearchBar loading={isLoading} onSearch={handleSearch} />

      {/* Refresh banner */}
      {isRefreshing && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          <span>Actualizare în curs…</span>
        </div>
      )}

      {/* First load spinner */}
      {isFirstLoad && (
        <div className="mt-10 flex flex-col items-center justify-center gap-3 py-10 text-center">
          <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Caut „{submitted}” pe {STORE_NAMES.join(", ")}…
          </p>
        </div>
      )}

      {/* Skeleton during first load */}
      {isFirstLoad && <SkeletonGrid />}

      {/* Error state */}
      {error && !isLoading && !data && (
        <div className="mt-8 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground">
          <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden="true" />
          <p>{error instanceof Error ? error.message : "A apărut o eroare."}</p>
        </div>
      )}

      {/* Results */}
      {data && !error && (
        <>
          {/* Cache timestamp */}
          {cachedAt && (
            <p className="text-xs text-muted-foreground text-right">
              Ultima actualizare: {formatTimeAgo(cachedAt)}
            </p>
          )}
          <ResultsSection data={data} />
        </>
      )}
    </div>
  )
}