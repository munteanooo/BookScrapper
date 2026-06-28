# BookScrapper

**CartePreț** — comparator de prețuri la cărți din Chișinău, Moldova. Caută o carte după titlu și vede instant prețurile, stocul și linkurile directe de pe cele mai mari librării din Chișinău: Librarius, Cărturești, Litera și Biblion. Datele sunt extrase prin scraping server-side și afișate într-o interfață modernă construită cu Next.js.

## Tehnologii

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19 + Tailwind CSS v4 + shadcn/ui
- **Scraping:** cheerio (HTML parsing) + fetch nativ
- **Client data fetching:** SWR
- **Cache + Rate Limiting:** Upstash Redis (Vercel KV)

## Variabile de mediu

Copiază `.env.example` ca `.env` și completează valorile:

| Variabila | Descriere |
|---|---|
| `UPSTASH_REDIS_REST_URL` | URL-ul bazei de date Upstash Redis (Vercel KV) |
| `UPSTASH_REDIS_REST_TOKEN` | Token-ul de autentificare Upstash Redis |

Fără aceste variabile, aplicația funcționează în regim **fallback**: caching și rate limiting sunt dezactivate automat, iar toate cererile merg direct la scrapere.

## Cum rulezi local

```bash
pnpm install
pnpm dev
```

Aplicația pornește pe `http://localhost:3000`.

## Build pentru producție

```bash
pnpm build
pnpm start
```

## Cum funcționează caching-ul

Caching-ul folosește **Upstash Redis** (Vercel KV) cu următoarele reguli:

- **Cache key:** `search:{query_normalizat}` (query-ul este făcut lowercase și trim)
- **TTL:** 3600 secunde (1 oră)
- La cerere, se verifică mai întâi cache-ul. Dacă există o intrare validă, se returnează direct fără a scrapa.
- Dacă nu există în cache, se execută scraping-ul și rezultatul este salvat (doar dacă cel puțin un magazin a răspuns cu succes).
- Răspunsurile includ header-ul `X-Cache: HIT` sau `X-Cache: MISS`.
- Dacă Redis nu este configurat, caching-ul este dezactivat automat (graceful degradation).

## Cum funcționează rate limiting-ul

Rate limiting-ul folosește **Upstash Ratelimit** cu algoritmul **sliding window**:

- **Limită:** 10 requesturi per IP per 60 secunde
- La depășirea limitei, se returnează status **429** cu `{error: "Too many requests", retryAfter: N}` și header-ul `Retry-After`.
- IP-ul clientului se extrage din header-ul `x-forwarded-for` (fallback: `x-real-ip`, fallback: `127.0.0.1`).
- Dacă Redis nu este configurat, rate limiting-ul este dezactivat automat.

## Endpoint-uri API

| Endpoint | Metoda | Descriere |
|---|---|---|
| `/api/search?q=...` | GET | Caută o carte după titlu și returnează rezultate agregate |
| `/api/health` | GET | Verifică starea aplicației și conexiunea la cache |

## Structură proiect

```
├── app/
│   ├── api/
│   │   ├── search/route.ts    # API căutare
│   │   └── health/route.ts    # Health check
│   ├── layout.tsx             # Layout principal
│   ├── page.tsx               # Pagina principală
│   └── globals.css            # Stiluri globale Tailwind
├── components/
│   ├── book-search.tsx        # Container căutare
│   ├── search-bar.tsx         # Formular căutare
│   ├── results-section.tsx    # Filtre + grid rezultate
│   ├── book-card.tsx          # Card carte individual
│   └── ui/button.tsx          # Componentă UI shadcn
├── lib/
│   ├── cache.ts               # Wrapper Redis (Vercel KV)
│   ├── rate-limit.ts          # Wrapper Upstash Ratelimit
│   ├── utils.ts               # Funcția cn()
│   └── scrapers/
│       ├── index.ts           # Orchestrator scrapere
│       ├── types.ts           # Tipuri TypeScript
│       ├── utils.ts           # Utilitare scraping
│       ├── librarius.ts       # Scraper Librarius
│       ├── carturesti.ts      # Scraper Cărturești
│       ├── litera.ts          # Scraper Litera
│       └── biblion.ts         # Scraper Biblion
├── public/
│   ├── robots.txt
│   └── ... (active statice)
├── next.config.mjs
├── vercel.json
├── .env.example
├── package.json
└── README.md
```

## Deploy pe Vercel

1. Conectează repository-ul GitHub la Vercel.
2. Adaugă variabilele de mediu (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) în dashboard-ul Vercel.
3. Creează un database KV în proiectul Vercel (Storage → KV → Create).
4. Deploy automat la fiecare push pe branch-ul principal.