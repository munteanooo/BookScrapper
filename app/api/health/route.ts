import { NextResponse } from "next/server"
import { isCacheConnected } from "@/lib/cache"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const cache = isCacheConnected()

  return NextResponse.json(
    {
      status: "ok",
      cache: cache ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )
}