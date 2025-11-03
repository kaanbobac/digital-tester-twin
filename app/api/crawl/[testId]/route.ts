import { type NextRequest, NextResponse } from "next/server"
import { getTestStatus } from "@/lib/crawler"

export async function GET(request: NextRequest, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const { testId } = await params

    const status = await getTestStatus(testId)

    if (!status) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error("[v0] Status check error:", error)
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 })
  }
}
