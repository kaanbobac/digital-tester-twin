"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Home,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Play,
  MousePointer,
  Type,
  Eye,
  ArrowDown,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface TestAction {
  id: string
  type: string
  element?: string
  value?: string
  timestamp: number
  screenshot?: string
  success: boolean
  description: string
}

interface Issue {
  id: string
  severity: "critical" | "high" | "medium" | "low"
  category: string
  description: string
  screenshot?: string
  action?: string
}

interface VisualReport {
  testId: string
  baseUrl: string
  status: string
  actions: TestAction[]
  issues: Issue[]
  startTime: number
  endTime: number
}

export function VisualReportDashboard({
  testId,
  initialReport,
}: {
  testId: string
  initialReport: VisualReport | null
}) {
  const [report, setReport] = useState<VisualReport | null>(initialReport)

  useEffect(() => {
    if (!report) {
      const stored = sessionStorage.getItem(`visual_report_${testId}`)
      if (stored) {
        setReport(JSON.parse(stored))
      }
    }
  }, [testId, report])

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="size-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Report Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The test report could not be loaded. It may have expired or the test ID is invalid.
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

  const duration = report.endTime - report.startTime
  const durationSeconds = Math.round(duration / 1000)

  const getActionIcon = (type: string) => {
    switch (type) {
      case "navigate":
        return <Play className="size-4" />
      case "click":
        return <MousePointer className="size-4" />
      case "fill":
        return <Type className="size-4" />
      case "scroll":
        return <ArrowDown className="size-4" />
      case "screenshot":
        return <Eye className="size-4" />
      default:
        return <CheckCircle2 className="size-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Visual Test Report</h1>
              <p className="text-muted-foreground">{report.baseUrl}</p>
            </div>
            <Link href="/">
              <Button variant="outline">
                <Home className="size-4 mr-2" />
                New Test
              </Button>
            </Link>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Play className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{report.actions.length}</p>
                  <p className="text-sm text-muted-foreground">Actions Performed</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="size-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{report.issues.length}</p>
                  <p className="text-sm text-muted-foreground">Issues Found</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{durationSeconds}s</p>
                  <p className="text-sm text-muted-foreground">Test Duration</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckCircle2 className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{report.actions.filter((a) => a.success).length}</p>
                  <p className="text-sm text-muted-foreground">Successful Actions</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList>
            <TabsTrigger value="timeline">Test Timeline</TabsTrigger>
            <TabsTrigger value="issues">Issues ({report.issues.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Action Timeline</h2>
              <div className="space-y-6">
                {report.actions.map((action, index) => (
                  <div key={action.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {getActionIcon(action.type)}
                      </div>
                      {index < report.actions.length - 1 && <div className="w-0.5 flex-1 bg-border mt-2" />}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{action.description}</h3>
                        <Badge variant="outline" className="text-xs">
                          {action.type}
                        </Badge>
                      </div>
                      {action.element && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Element: <span className="font-mono bg-muted px-1 rounded">{action.element}</span>
                          {action.value && (
                            <>
                              {" "}
                              = <span className="font-mono bg-muted px-1 rounded">"{action.value}"</span>
                            </>
                          )}
                        </p>
                      )}
                      {action.screenshot && (
                        <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border mt-3">
                          <Image
                            src={action.screenshot || "/placeholder.svg"}
                            alt={action.description}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            {report.issues.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle2 className="size-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Issues Found!</h3>
                <p className="text-muted-foreground">
                  The visual test completed successfully without detecting any issues.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {report.issues.map((issue) => (
                  <Card key={issue.id} className="p-6">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="size-5 text-destructive flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                          <Badge variant="outline">{issue.category}</Badge>
                        </div>
                        <p className="text-sm leading-relaxed">{issue.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
