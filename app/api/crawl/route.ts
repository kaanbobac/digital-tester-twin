import { type NextRequest, NextResponse } from "next/server"
import { crawlWebsite } from "@/lib/crawler"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Generate a unique test ID
    const testId = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Start crawling in the background (don't await)
    crawlWebsite(url, testId).catch((error) => {
      console.error("[v0] Crawl error:", error)
    })

    return NextResponse.json({ testId, status: "started" })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Failed to start crawl" }, { status: 500 })
  }
}
