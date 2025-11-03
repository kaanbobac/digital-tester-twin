"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2, AlertCircle, Home } from "lucide-react"
import Link from "next/link"

interface CrawlStatus {
  status: "crawling" | "analyzing" | "complete" | "error"
  progress: number
  pagesFound: number
  currentPage?: string
  message?: string
  testId?: string
}

export default function TestPage() {
  const searchParams = useSearchParams()
  const url = searchParams.get("url")
  const [crawlStatus, setCrawlStatus] = useState<CrawlStatus>({
    status: "crawling",
    progress: 0,
    pagesFound: 0,
  })

  useEffect(() => {
    if (!url) return

    const startCrawl = async () => {
      try {
        const response = await fetch("/api/crawl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        })

        if (!response.ok) {
          throw new Error("Failed to start crawl")
        }

        const { testId } = await response.json()

        // Poll for status updates
        const pollInterval = setInterval(async () => {
          const statusResponse = await fetch(`/api/crawl/${testId}`)
          const status = await statusResponse.json()

          setCrawlStatus(status)

          if (status.status === "complete" || status.status === "error") {
            clearInterval(pollInterval)
            if (status.status === "complete") {
              // Redirect to report after a brief delay
              setTimeout(() => {
                window.location.href = `/report/${testId}`
              }, 1500)
            }
          }
        }, 1000)

        return () => clearInterval(pollInterval)
      } catch (error) {
        setCrawlStatus({
          status: "error",
          progress: 0,
          pagesFound: 0,
          message: "Failed to start website test. Please try again.",
        })
      }
    }

    startCrawl()
  }, [url])

  if (!url) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="size-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No URL Provided</h2>
          <p className="text-muted-foreground mb-6">Please provide a URL to test.</p>
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-8 max-w-2xl w-full">
        <div className="text-center space-y-6">
          {/* Status Icon */}
          <div className="flex justify-center">
            {crawlStatus.status === "error" ? (
              <AlertCircle className="size-16 text-destructive" />
            ) : crawlStatus.status === "complete" ? (
              <CheckCircle2 className="size-16 text-primary animate-in zoom-in duration-300" />
            ) : (
              <Loader2 className="size-16 text-primary animate-spin" />
            )}
          </div>

          {/* Status Text */}
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {crawlStatus.status === "crawling" && "Discovering Pages"}
              {crawlStatus.status === "analyzing" && "Analyzing Website"}
              {crawlStatus.status === "complete" && "Test Complete!"}
              {crawlStatus.status === "error" && "Test Failed"}
            </h2>
            <p className="text-muted-foreground">
              {crawlStatus.message ||
                (crawlStatus.status === "crawling" && `Found ${crawlStatus.pagesFound} pages so far...`) ||
                (crawlStatus.status === "analyzing" && "Running automated tests and capturing screenshots") ||
                (crawlStatus.status === "complete" && "Generating your comprehensive report")}
            </p>
          </div>

          {/* Progress Bar */}
          {crawlStatus.status !== "error" && (
            <div className="space-y-2">
              <Progress value={crawlStatus.progress} className="h-2" />
              <p className="text-sm text-muted-foreground">{Math.round(crawlStatus.progress)}% complete</p>
            </div>
          )}

          {/* Current Page */}
          {crawlStatus.currentPage && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Currently testing:</p>
              <p className="text-sm font-mono truncate">{crawlStatus.currentPage}</p>
            </div>
          )}

          {/* Testing URL */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-1">Testing website:</p>
            <p className="text-sm font-semibold truncate">{url}</p>
          </div>

          {/* Error Actions */}
          {crawlStatus.status === "error" && (
            <div className="flex gap-3 justify-center pt-4">
              <Link href="/">
                <Button variant="outline">
                  <Home className="size-4 mr-2" />
                  Go Home
                </Button>
              </Link>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
