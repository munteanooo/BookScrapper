import { BookSearch } from "@/components/book-search"
import { BookOpen, Store } from "lucide-react"

const STORES = ["Librarius", "Cărturești", "Litera", "Biblion"]

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-heading text-xl font-semibold leading-none text-foreground">
              CartePreț
            </p>
            <p className="text-sm text-muted-foreground">
              Comparator de cărți din Moldova
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-balance font-heading text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            Caută o carte, vezi prețul pe toate librăriile din Chișinău
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            Introdu titlul cărții și îți aducem instant rezultatele reale, cu
            prețuri, disponibilitate și link direct către fiecare magazin.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl">
          <BookSearch />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Store className="h-4 w-4" aria-hidden="true" />
            Caut pe:
          </span>
          {STORES.map((store, i) => (
            <span key={store}>
              <span className="font-medium text-foreground">{store}</span>
              {i < STORES.length - 1 ? (
                <span className="text-border"> · </span>
              ) : null}
            </span>
          ))}
        </div>
      </section>
    </main>
  )
}
