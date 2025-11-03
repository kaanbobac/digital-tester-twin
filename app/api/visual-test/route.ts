import { type NextRequest, NextResponse } from "next/server"
import { crawlWebsite } from "@/lib/crawler"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    const testId = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`

    console.log("[v0] Starting visual test for URL:", url)

    crawlWebsite(url, testId).catch((error) => {
      console.error("[v0] Visual test error:", error)
    })

    return NextResponse.json({ testId })
  } catch (error) {
    console.error("[v0] Visual test API error:", error)
    return NextResponse.json({ error: "Failed to start visual test" }, { status: 500 })
  }
}
