"use client"

import { Loader2, Search } from "lucide-react"
import { type FormEvent, useState } from "react"

export function SearchBar({
  initialValue = "",
  loading,
  onSearch,
}: {
  initialValue?: string
  loading: boolean
  onSearch: (query: string) => void
}) {
  const [value, setValue] = useState(initialValue)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed.length > 0) onSearch(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-ring/40">
        <Search className="ml-2 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Introdu titlul cărții, ex: Harry Potter"
          aria-label="Titlul cărții"
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={loading || value.trim().length === 0}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="size-4" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">{loading ? "Caut…" : "Caută"}</span>
        </button>
      </div>
    </form>
  )
}
