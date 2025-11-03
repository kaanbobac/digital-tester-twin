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
  Lightbulb,
  Search,
  Zap,
  Palette,
  Shield,
  FileText,
  Target,
} from "lucide-react"
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

  const issuesByCategory = report.issues.reduce(
    (acc, issue) => {
      if (!acc[issue.category]) {
        acc[issue.category] = []
      }
      acc[issue.category].push(issue)
      return acc
    },
    {} as Record<string, Issue[]>,
  )

  const criticalCount = report.issues.filter((i) => i.severity === "critical").length
  const highCount = report.issues.filter((i) => i.severity === "high").length
  const mediumCount = report.issues.filter((i) => i.severity === "medium").length
  const lowCount = report.issues.filter((i) => i.severity === "low").length

  const scenariosCount = report.actions.length
  const uniqueActionTypes = new Set(report.actions.map((a) => a.type)).size

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "accessibility":
        return <Eye className="size-5" />
      case "seo":
        return <Search className="size-5" />
      case "performance":
        return <Zap className="size-5" />
      case "security":
        return <Shield className="size-5" />
      case "ux":
      case "ui/ux":
        return <Palette className="size-5" />
      default:
        return <AlertTriangle className="size-5" />
    }
  }

  const getSolution = (issue: Issue): string => {
    const desc = issue.description.toLowerCase()

    if (desc.includes("alt text") || desc.includes("alt attribute")) {
      return 'Add descriptive alt text to all images using the alt attribute. For decorative images, use alt="" to indicate they should be ignored by screen readers.'
    }
    if (desc.includes("form label") || (desc.includes("input") && desc.includes("label"))) {
      return "Wrap form inputs with <label> elements or use aria-label attributes to provide accessible labels for all form fields."
    }
    if (desc.includes("aria")) {
      return "Add appropriate ARIA attributes (aria-label, aria-describedby, role) to improve accessibility for screen reader users."
    }
    if (desc.includes("heading structure") || desc.includes("h1")) {
      return "Ensure proper heading hierarchy (h1 → h2 → h3) without skipping levels. Each page should have exactly one h1 tag."
    }
    if (desc.includes("button") && desc.includes("accessible")) {
      return "Add aria-label or descriptive text content to buttons so screen reader users understand their purpose."
    }

    if (desc.includes("meta description")) {
      return "Add a meta description tag in the <head> section with a compelling 150-160 character summary of the page content."
    }
    if (desc.includes("title tag") || desc.includes("page title")) {
      return "Add a unique, descriptive <title> tag (50-60 characters) that accurately describes the page content and includes relevant keywords."
    }
    if (desc.includes("open graph") || desc.includes("og:")) {
      return "Add Open Graph meta tags (og:title, og:description, og:image) to improve how your page appears when shared on social media."
    }
    if (desc.includes("canonical")) {
      return "Add a canonical link tag to specify the preferred URL version and avoid duplicate content issues."
    }
    if (desc.includes("structured data") || desc.includes("schema")) {
      return "Implement JSON-LD structured data (Schema.org) to help search engines understand your content better."
    }

    if (desc.includes("empty link") || (desc.includes("link") && desc.includes("text"))) {
      return "Ensure all links have descriptive text content. Avoid generic text like 'click here' - use meaningful descriptions instead."
    }
    if (desc.includes("small text") || desc.includes("font size")) {
      return "Increase font size to at least 16px for body text to improve readability, especially on mobile devices."
    }
    if (desc.includes("contrast")) {
      return "Improve color contrast between text and background to meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)."
    }

    if (desc.includes("external script") || desc.includes("javascript")) {
      return "Add async or defer attributes to external script tags to prevent blocking page rendering. Consider bundling scripts to reduce requests."
    }
    if (desc.includes("inline style")) {
      return "Move inline styles to external CSS files or use CSS-in-JS solutions to improve maintainability and caching."
    }

    if (desc.includes("form") && desc.includes("action")) {
      return "Add an action attribute to forms specifying where form data should be submitted, or implement JavaScript form handling."
    }
    if (desc.includes("deprecated")) {
      return "Replace deprecated HTML tags with modern semantic alternatives. Check MDN documentation for recommended replacements."
    }
    if (desc.includes("button type")) {
      return 'Add explicit type attributes to buttons (type="button", type="submit", or type="reset") to prevent unexpected form submissions.'
    }

    if (desc.includes("mixed content") || (desc.includes("http") && desc.includes("https"))) {
      return "Ensure all resources (scripts, stylesheets, images) are loaded over HTTPS to prevent mixed content warnings and security vulnerabilities."
    }
    if (desc.includes("x-frame-options") || desc.includes("clickjacking")) {
      return "Add X-Frame-Options header (DENY or SAMEORIGIN) to prevent clickjacking attacks where your site is embedded in malicious iframes."
    }
    if (desc.includes("content-security-policy") || desc.includes("csp")) {
      return "Implement Content-Security-Policy headers to prevent XSS attacks by controlling which resources can be loaded and executed."
    }
    if (desc.includes("autocomplete") && desc.includes("password")) {
      return 'Ensure password fields have autocomplete="new-password" or autocomplete="current-password" for better security and user experience.'
    }

    if (desc.includes("render-blocking") || desc.includes("blocking resource")) {
      return "Move critical CSS inline and defer non-critical CSS. Add async or defer attributes to JavaScript files to prevent render blocking."
    }
    if (desc.includes("image optimization") || desc.includes("large image")) {
      return "Optimize images by compressing them, using modern formats (WebP, AVIF), and implementing responsive images with srcset."
    }
    if (desc.includes("caching") || desc.includes("cache-control")) {
      return "Implement proper cache-control headers for static assets to improve load times for returning visitors."
    }

    return "Review the issue description and implement the recommended fix. Consult WCAG guidelines, MDN documentation, or web.dev for detailed implementation guidance."
  }

  const generateExecutiveSummary = () => {
    const totalIssues = report.issues.length
    const criticalAndHigh = criticalCount + highCount
    const categories = Object.keys(issuesByCategory)

    if (totalIssues === 0) {
      return "Excellent! Your website passed all automated tests without any issues detected. The site demonstrates good practices in accessibility, SEO, performance, and security."
    }

    const priorityText =
      criticalAndHigh > 0
        ? `${criticalAndHigh} critical or high-priority ${criticalAndHigh === 1 ? "issue" : "issues"} requiring immediate attention`
        : "no critical issues"

    const categoryText =
      categories.length > 0
        ? `Issues were found in ${categories.length} ${categories.length === 1 ? "category" : "categories"}: ${categories.join(", ")}`
        : ""

    return `Your website was tested with ${scenariosCount} automated scenarios across ${uniqueActionTypes} different test types. We identified ${totalIssues} ${totalIssues === 1 ? "issue" : "issues"} with ${priorityText}. ${categoryText}. Addressing these issues will improve user experience, search engine visibility, and overall site quality.`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Test Report</h1>
              <p className="text-muted-foreground">{report.baseUrl}</p>
            </div>
            <Link href="/">
              <Button variant="outline">
                <Home className="size-4 mr-2" />
                New Test
              </Button>
            </Link>
          </div>

          <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">Executive Summary</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{generateExecutiveSummary()}</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{scenariosCount}</p>
                  <p className="text-sm text-muted-foreground">Scenarios Tested</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertCircle className="size-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{criticalCount + highCount}</p>
                  <p className="text-sm text-muted-foreground">Critical & High</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <AlertTriangle className="size-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mediumCount}</p>
                  <p className="text-sm text-muted-foreground">Medium Priority</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <AlertTriangle className="size-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{lowCount}</p>
                  <p className="text-sm text-muted-foreground">Low Priority</p>
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {report.issues.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle2 className="size-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Issues Found!</h3>
            <p className="text-muted-foreground">
              The test completed successfully without detecting any issues. Your website appears to be well-optimized.
            </p>
          </Card>
        ) : (
          <Tabs defaultValue={Object.keys(issuesByCategory)[0]} className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Issues ({report.issues.length})</TabsTrigger>
              {Object.keys(issuesByCategory).map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category} ({issuesByCategory[category].length})
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {Object.entries(issuesByCategory).map(([category, issues]) => (
                <Card key={category} className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">{getCategoryIcon(category)}</div>
                    <h2 className="text-xl font-semibold">{category}</h2>
                    <Badge variant="outline">{issues.length} issues</Badge>
                  </div>
                  <div className="space-y-4">
                    {issues.map((issue) => (
                      <div key={issue.id} className="border-l-2 border-border pl-4 py-2">
                        <div className="flex items-start gap-3 mb-2">
                          <Badge variant={getSeverityColor(issue.severity)} className="mt-0.5">
                            {issue.severity}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium mb-1">{issue.description}</p>
                            <div className="flex items-start gap-2 mt-3 p-3 bg-muted rounded-lg">
                              <Lightbulb className="size-4 text-primary flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-1">Recommended Solution:</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">{getSolution(issue)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </TabsContent>

            {Object.entries(issuesByCategory).map(([category, issues]) => (
              <TabsContent key={category} value={category} className="space-y-4">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-primary/10">{getCategoryIcon(category)}</div>
                    <div>
                      <h2 className="text-xl font-semibold">{category} Issues</h2>
                      <p className="text-sm text-muted-foreground">
                        Found {issues.length} {issues.length === 1 ? "issue" : "issues"} in this category
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {issues.map((issue) => (
                      <div key={issue.id} className="border-l-2 border-border pl-4 py-2">
                        <div className="flex items-start gap-3 mb-2">
                          <Badge variant={getSeverityColor(issue.severity)} className="mt-0.5">
                            {issue.severity}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium mb-1">{issue.description}</p>
                            <div className="flex items-start gap-2 mt-3 p-3 bg-muted rounded-lg">
                              <Lightbulb className="size-4 text-primary flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-1">Recommended Solution:</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">{getSolution(issue)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  )
}
