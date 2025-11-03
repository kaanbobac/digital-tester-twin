"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"

interface TestAction {
  id: string
  type: string
  element?: string
  value?: string
  timestamp: number
  screenshot?: string
  success: boolean
  description: string
  url?: string
  clickPosition?: { x: number; y: number }
  scrollPosition?: number
}

interface VisualTestStatus {
  status: "testing" | "complete" | "error"
  progress: number
  currentAction?: string
  errorMessage?: string
  actions: TestAction[]
  report?: any
}

export default function VisualTestPage() {
  const searchParams = useSearchParams()
  const url = searchParams.get("url")
  const [testStatus, setTestStatus] = useState<VisualTestStatus>({
    status: "testing",
    progress: 0,
    actions: [],
  })
  const [currentUrl, setCurrentUrl] = useState(url || "")
  const [activeAction, setActiveAction] = useState<TestAction | null>(null)

  useEffect(() => {
    if (!url) return

    const startTest = async () => {
      try {
        console.log("[v0] Starting visual test for URL:", url)
        const response = await fetch("/api/visual-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        })

        if (!response.ok) {
          console.error("[v0] Visual test failed:", await response.text())
          setTestStatus({ status: "error", progress: 0, actions: [], errorMessage: await response.text() })
          return
        }

        const { testId } = await response.json()
        console.log("[v0] Test ID:", testId)

        // Poll for updates
        const pollInterval = setInterval(async () => {
          const statusResponse = await fetch(`/api/visual-test/${testId}`)
          const status = await statusResponse.json()

          console.log("[v0] Test status update:", status.status, status.progress)

          const transformedActions = (status.actions || []).map((action: any) => ({
            id: action.id,
            type: action.type,
            element: action.details || action.targetUrl,
            value: undefined,
            timestamp: action.timestamp,
            screenshot: undefined,
            success: action.status === "success",
            description: action.description,
            url: action.url || action.targetUrl,
          }))

          setTestStatus({
            ...status,
            actions: transformedActions,
          })

          if (transformedActions.length > 0) {
            const latestAction = transformedActions[transformedActions.length - 1]
            setActiveAction(latestAction)
            if (latestAction.url) {
              setCurrentUrl(latestAction.url)
            }
          }

          if (status.status === "complete") {
            clearInterval(pollInterval)
            console.log("[v0] Test complete, redirecting to report")

            const reportData = {
              testId,
              baseUrl: url,
              status: status.status,
              actions: transformedActions,
              issues:
                status.pages?.flatMap((page: any) =>
                  [...(page.errors || []), ...(page.visualIssues || [])].map((issue: string, idx: number) => {
                    const issueLower = issue.toLowerCase()

                    // Determine category based on issue text
                    let category = "General"
                    if (issueLower.includes("accessibility")) {
                      category = "Accessibility"
                    } else if (
                      issueLower.includes("seo") ||
                      issueLower.includes("meta") ||
                      issueLower.includes("open graph") ||
                      issueLower.includes("canonical")
                    ) {
                      category = "SEO"
                    } else if (
                      issueLower.includes("ux") ||
                      issueLower.includes("ui") ||
                      issueLower.includes("user experience") ||
                      issueLower.includes("usability")
                    ) {
                      category = "UI/UX"
                    } else if (
                      issueLower.includes("performance") ||
                      issueLower.includes("render-blocking") ||
                      issueLower.includes("layout shift")
                    ) {
                      category = "Performance"
                    } else if (
                      issueLower.includes("security") ||
                      issueLower.includes("xss") ||
                      issueLower.includes("mixed content") ||
                      issueLower.includes("https")
                    ) {
                      category = "Security"
                    } else if (
                      issueLower.includes("functionality") ||
                      issueLower.includes("http") ||
                      issueLower.includes("broken") ||
                      issueLower.includes("deprecated")
                    ) {
                      category = "Functionality"
                    }

                    // Determine severity
                    let severity = "low"
                    if (issueLower.includes("critical") || issueLower.includes("security")) {
                      severity = "critical"
                    } else if (
                      issueLower.includes("error") ||
                      issueLower.includes("broken") ||
                      issueLower.includes("missing")
                    ) {
                      severity = "high"
                    } else if (issueLower.includes("warning") || issueLower.includes("should")) {
                      severity = "medium"
                    }

                    return {
                      id: `issue_${page.url}_${idx}`,
                      severity,
                      category,
                      description: issue,
                      screenshot: page.screenshot,
                      url: page.url,
                    }
                  }),
                ) || [],
              startTime: status.startTime,
              endTime: status.endTime || Date.now(),
            }

            sessionStorage.setItem(`visual_report_${testId}`, JSON.stringify(reportData))
            setTimeout(() => {
              window.location.href = `/visual-report/${testId}`
            }, 2000)
          }

          if (status.status === "error") {
            clearInterval(pollInterval)
          }
        }, 1000)

        return () => clearInterval(pollInterval)
      } catch (error) {
        console.error("[v0] Test error:", error)
        setTestStatus({ status: "error", progress: 0, actions: [], errorMessage: String(error) })
      }
    }

    startTest()
  }, [url])

  if (!url) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="size-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No URL Provided</h2>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">🤖 Robot Testing Your Website</h1>
              <p className="text-muted-foreground">Testing: {url}</p>
            </div>
            <div className="flex items-center gap-4">
              {testStatus.status === "complete" ? (
                <CheckCircle2 className="size-8 text-primary" />
              ) : testStatus.status === "error" ? (
                <AlertCircle className="size-8 text-destructive" />
              ) : (
                <Loader2 className="size-8 text-primary animate-spin" />
              )}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Progress value={testStatus.progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {testStatus.status === "error"
                ? "Test failed - see error details below"
                : testStatus.currentAction || "Initializing test..."}
            </p>
          </div>
        </Card>

        {testStatus.status === "error" && testStatus.errorMessage && (
          <Card className="p-6 border-destructive bg-destructive/5">
            <div className="flex gap-4">
              <AlertCircle className="size-6 text-destructive flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Test Failed</h3>
                <p className="text-sm text-muted-foreground">{testStatus.errorMessage}</p>
                <div className="pt-2">
                  <Link href="/">
                    <Button variant="outline" size="sm">
                      Try Another Website
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Browser-like visualization with iframe showing actual website */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">🌐 Live Browser View</h2>
          <div className="space-y-4">
            {/* Browser chrome */}
            <div className="bg-muted rounded-t-lg p-3 flex items-center gap-2 border-b">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-red-500" />
                <div className="size-3 rounded-full bg-yellow-500" />
                <div className="size-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 bg-background rounded px-3 py-1.5 text-sm font-mono text-muted-foreground">
                {currentUrl}
              </div>
            </div>

            <div className="relative bg-muted rounded-b-lg overflow-hidden border-2 border-border">
              <iframe
                key={currentUrl}
                src={currentUrl}
                className="w-full h-[600px] bg-white"
                title="Website being tested"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />

              {testStatus.status === "testing" && activeAction && (
                <>
                  {/* Click indicator */}
                  {activeAction.type === "click" && activeAction.clickPosition && (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${activeAction.clickPosition.x}%`,
                        top: `${activeAction.clickPosition.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div className="size-16 rounded-full bg-primary/30 animate-ping" />
                      <div className="absolute inset-0 size-16 rounded-full border-4 border-primary" />
                    </div>
                  )}

                  {/* Scroll indicator */}
                  {activeAction.type === "scroll" && activeAction.scrollPosition !== undefined && (
                    <div className="absolute right-4 top-0 bottom-0 w-2 bg-muted-foreground/20 rounded-full pointer-events-none">
                      <div
                        className="w-full bg-primary rounded-full transition-all duration-1000"
                        style={{ height: `${activeAction.scrollPosition}%` }}
                      />
                    </div>
                  )}

                  {/* Form fill indicator */}
                  {activeAction.type === "fill" && activeAction.clickPosition && (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${activeAction.clickPosition.x}%`,
                        top: `${activeAction.clickPosition.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div className="bg-primary/20 border-2 border-primary rounded px-4 py-2 animate-pulse">
                        <span className="text-sm font-mono text-primary font-semibold">{activeAction.value}</span>
                      </div>
                    </div>
                  )}

                  {/* Action overlay */}
                  <div className="absolute bottom-4 left-4 right-4 bg-background/95 rounded-lg p-4 shadow-2xl border-2 border-primary">
                    <div className="flex items-center gap-3">
                      <Loader2 className="size-6 text-primary animate-spin flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold">{activeAction.description}</p>
                        {activeAction.element && (
                          <p className="text-sm text-muted-foreground">
                            Element: <span className="font-mono">{activeAction.element}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-primary">{testStatus.progress}%</div>
                    </div>
                  </div>
                </>
              )}

              {/* Success overlay when complete */}
              {testStatus.status === "complete" && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                  <div className="bg-background rounded-lg p-6 max-w-md text-center shadow-2xl border-2 border-primary">
                    <CheckCircle2 className="size-12 text-primary mx-auto mb-4" />
                    <p className="text-lg font-semibold">Testing Complete!</p>
                    <p className="text-sm text-muted-foreground mt-2">Redirecting to report...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Action Timeline */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Test Actions Timeline</h2>
          <div className="space-y-4">
            {(testStatus.actions || []).map((action, index) => (
              <div
                key={action.id}
                className={`flex gap-4 items-start border-l-2 pl-4 transition-all ${
                  index === testStatus.actions.length - 1 && testStatus.status === "testing"
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30"
                }`}
              >
                <div
                  className={`flex-shrink-0 size-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    action.success ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"
                  }`}
                >
                  {action.success ? "✓" : "✗"}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{action.description}</span>
                    {index === testStatus.actions.length - 1 && testStatus.status === "testing" && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full animate-pulse">
                        In Progress
                      </span>
                    )}
                  </div>
                  {action.element && (
                    <div className="bg-muted p-2 rounded text-sm">
                      <span className="text-muted-foreground">Element:</span>{" "}
                      <span className="font-mono font-semibold">{action.element}</span>
                      {action.value && (
                        <>
                          {" = "}
                          <span className="font-mono text-primary">"{action.value}"</span>
                        </>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{new Date(action.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
