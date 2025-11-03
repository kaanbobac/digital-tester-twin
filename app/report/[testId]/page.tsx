"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ReportDashboard } from "@/components/report-dashboard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Home, Loader2 } from "lucide-react"
import Link from "next/link"

export default function ReportPage() {
  const params = useParams()
  const testId = params.testId as string
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    console.log("[v0] Loading report for testId:", testId)

    const storedReport = sessionStorage.getItem(`report_${testId}`)
    if (storedReport) {
      console.log("[v0] Found report in sessionStorage")
      try {
        const parsedReport = JSON.parse(storedReport)
        setReport(parsedReport)
        setLoading(false)
        return
      } catch (e) {
        console.error("[v0] Failed to parse stored report:", e)
      }
    }

    console.log("[v0] Report not found in sessionStorage")
    setError(true)
    setLoading(false)
  }, [testId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <Loader2 className="size-12 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold mb-2">Loading Report</h2>
          <p className="text-muted-foreground">Please wait...</p>
        </Card>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="size-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Report Not Found</h2>
          <p className="text-muted-foreground mb-6">
            This test report doesn't exist or has expired. Please run a new test.
          </p>
          <Link href="/">
            <Button>
              <Home className="size-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return <ReportDashboard report={report} />
}
