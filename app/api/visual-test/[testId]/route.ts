import { type NextRequest, NextResponse } from "next/server"
import { getTestStatus, getTestResults } from "@/lib/crawler"

export async function GET(request: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const { testId } = await params
    console.log("[v0] Getting status for test:", testId)

    const status = await getTestStatus(testId)

    if (!status) {
      console.log("[v0] Test not found:", testId)
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    console.log("[v0] Test status:", status.status, "Progress:", status.progress)

    if (status.status === "complete") {
      const fullData = await getTestResults(testId)
      return NextResponse.json({
        ...status,
        actions: fullData?.actions || [],
        pagesFound: fullData?.pagesFound || 0,
      })
    }

    const fullData = await getTestResults(testId)
    return NextResponse.json({
      ...status,
      actions: fullData?.actions || [],
    })
  } catch (error) {
    console.error("[v0] Error getting test status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
