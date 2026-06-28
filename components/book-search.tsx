"use client"

import { AlertTriangle, Loader2 } from "lucide-react"
import { useState } from "react"
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

export function BookSearch() {
  const [submitted, setSubmitted] = useState("")

  const { data, error, isLoading } = useSWR(
    submitted ? `/api/search?q=${encodeURIComponent(submitted)}` : null,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: false },
  )

  return (
    <div className="flex flex-col gap-2">
      <SearchBar loading={isLoading} onSearch={setSubmitted} />

      {isLoading && (
        <div className="mt-10 flex flex-col items-center justify-center gap-3 py-10 text-center">
          <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Caut „{submitted}” pe {STORE_NAMES.join(", ")}…
          </p>
        </div>
      )}

      {error && !isLoading && (
        <div className="mt-8 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground">
          <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden="true" />
          <p>{error instanceof Error ? error.message : "A apărut o eroare."}</p>
        </div>
      )}

      {data && !isLoading && !error && <ResultsSection data={data} />}
    </div>
  )
}
