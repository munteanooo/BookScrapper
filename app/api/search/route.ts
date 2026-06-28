import { type NextRequest, NextResponse } from "next/server"
import { searchAllStores } from "@/lib/scrapers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || ""
  if (!query.trim()) {
    return NextResponse.json({ query: "", stores: [], totalResults: 0 })
  }

  try {
    const data = await searchAllStores(query)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Eroare la căutare" },
      { status: 500 },
    )
  }
}
