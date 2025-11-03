import { getVisualTestReport } from "@/lib/visual-tester"
import { VisualReportDashboard } from "@/components/visual-report-dashboard"

export default async function VisualReportPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params

  // Try to get report from server first
  const report = await getVisualTestReport(testId)

  // If not found on server, it will be loaded from sessionStorage on client
  if (!report) {
    return <VisualReportDashboard testId={testId} initialReport={null} />
  }

  return <VisualReportDashboard testId={testId} initialReport={report} />
}
