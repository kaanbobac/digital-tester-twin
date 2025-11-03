import { getAnalyzedReport } from "@/lib/crawler"
import { ReportDashboard } from "@/components/report-dashboard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Home } from "lucide-react"
import Link from "next/link"

export default async function ReportPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params
  const report = await getAnalyzedReport(testId)

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="size-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Report Not Found</h2>
          <p className="text-muted-foreground mb-6">This test report doesn't exist or hasn't completed yet.</p>
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
