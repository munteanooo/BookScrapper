import { ArrowUpRight, BookOpen, CheckCircle2, CircleHelp, XCircle } from "lucide-react"
import type { BookResult } from "@/lib/scrapers/types"

const STORE_COLORS: Record<string, string> = {
  librarius: "bg-chart-4/10 text-chart-4",
  carturesti: "bg-primary/10 text-primary",
  litera: "bg-chart-2/15 text-chart-2",
  biblion: "bg-chart-5/10 text-chart-5",
}

function StockBadge({ stock }: { stock: BookResult["stock"] }) {
  if (stock === "in_stock") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        În stoc
      </span>
    )
  }
  if (stock === "out_of_stock") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
        <XCircle className="size-3.5" aria-hidden="true" />
        Stoc epuizat
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <CircleHelp className="size-3.5" aria-hidden="true" />
      Stoc neconfirmat
    </span>
  )
}

export function BookCard({ book, isCheapest }: { book: BookResult; isCheapest?: boolean }) {
  return (
    <a
      href={book.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {isCheapest && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-success px-2 py-0.5 text-[11px] font-semibold text-success-foreground shadow-sm">
          Cel mai mic preț
        </span>
      )}

      <div className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {book.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.image || "/placeholder.svg"}
            alt={`Coperta cărții ${book.title}`}
            className="h-full w-full object-cover"
            loading="lazy"
            crossOrigin="anonymous"
          />
        ) : (
          <BookOpen className="size-7 text-muted-foreground/50" aria-hidden="true" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              STORE_COLORS[book.store] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {book.storeName}
          </span>
          <ArrowUpRight
            className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        </div>

        <h3 className="mt-1.5 line-clamp-2 text-pretty font-heading text-[15px] font-semibold leading-snug text-card-foreground">
          {book.title}
        </h3>
        {book.author && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{book.author}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="leading-none">
            {book.price != null ? (
              <span className="font-heading text-lg font-bold text-foreground">
                {book.price.toLocaleString("ro-MD", { minimumFractionDigits: 2 })}{" "}
                <span className="text-xs font-medium text-muted-foreground">MDL</span>
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">{book.priceText || "Preț indisponibil"}</span>
            )}
          </div>
          <StockBadge stock={book.stock} />
        </div>
      </div>
    </a>
  )
}
