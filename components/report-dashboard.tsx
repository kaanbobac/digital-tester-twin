"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Home,
  Download,
  Bug,
  Eye,
  Zap,
  Search,
  Shield,
  Accessibility,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import Link from "next/link"
import type { AnalysisReport, IssueSeverity, IssueCategory } from "@/lib/analyzer"
import { CrawlPathTree } from "./crawl-path-tree"

interface ReportDashboardProps {
  report: AnalysisReport
}

export function ReportDashboard({ report }: ReportDashboardProps) {
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set())

  const toggleIssue = (id: string) => {
    const newExpanded = new Set(expandedIssues)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIssues(newExpanded)
  }

  const calculateHealthScore = () => {
    const weights = { critical: 10, high: 5, medium: 2, low: 1 }
    const totalWeight =
      report.issuesBySeverity.critical * weights.critical +
      report.issuesBySeverity.high * weights.high +
      report.issuesBySeverity.medium * weights.medium +
      report.issuesBySeverity.low * weights.low

    const maxPossibleWeight = report.totalPages * 20
    const score = Math.max(0, Math.min(100, 100 - (totalWeight / maxPossibleWeight) * 100))
    return Math.round(score)
  }

  const healthScore = calculateHealthScore()

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    if (score >= 40) return "text-orange-500"
    return "text-red-500"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Poor"
  }

  const getSeverityIcon = (severity: IssueSeverity) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="size-4" />
      case "high":
        return <AlertTriangle className="size-4" />
      case "medium":
        return <Info className="size-4" />
      case "low":
        return <CheckCircle2 className="size-4" />
    }
  }

  const getCategoryIcon = (category: IssueCategory) => {
    switch (category) {
      case "functionality":
        return <Bug className="size-4" />
      case "accessibility":
        return <Accessibility className="size-4" />
      case "performance":
        return <Zap className="size-4" />
      case "seo":
        return <Search className="size-4" />
      case "ux":
        return <Eye className="size-4" />
      case "security":
        return <Shield className="size-4" />
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const issuesBySeverity = {
    critical: report.issues.filter((i) => i.severity === "critical"),
    high: report.issues.filter((i) => i.severity === "high"),
    medium: report.issues.filter((i) => i.severity === "medium"),
    low: report.issues.filter((i) => i.severity === "low"),
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
              <Bug className="size-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">SiteAuditor</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export
            </Button>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="size-4 mr-2" />
                New Test
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          <aside className="space-y-4">
            {/* Health Score Card */}
            <Card className="p-6 text-center">
              <div className="text-sm text-muted-foreground mb-2">Health Score</div>
              <div className={`text-5xl font-bold mb-2 ${getScoreColor(healthScore)}`}>{healthScore}</div>
              <div className="text-sm font-medium mb-3">{getScoreLabel(healthScore)}</div>
              <Progress value={healthScore} className="h-2" />
            </Card>

            {/* Quick Stats */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pages Tested</span>
                <span className="text-lg font-semibold">{report.totalPages}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Issues</span>
                <span className="text-lg font-semibold">{report.totalIssues}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="text-lg font-semibold">{formatDuration(report.testDuration)}</span>
              </div>
            </Card>

            {/* Severity Breakdown */}
            <Card className="p-4">
              <div className="text-sm font-medium mb-3">Issues by Severity</div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="size-4 text-red-500" />
                      <span>Critical</span>
                    </div>
                    <span className="text-sm font-semibold">{report.issuesBySeverity.critical}</span>
                  </div>
                  <Progress
                    value={(report.issuesBySeverity.critical / report.totalIssues) * 100}
                    className="h-1.5 bg-red-500/20"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="size-4 text-orange-500" />
                      <span>High</span>
                    </div>
                    <span className="text-sm font-semibold">{report.issuesBySeverity.high}</span>
                  </div>
                  <Progress
                    value={(report.issuesBySeverity.high / report.totalIssues) * 100}
                    className="h-1.5 bg-orange-500/20"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Info className="size-4 text-yellow-500" />
                      <span>Medium</span>
                    </div>
                    <span className="text-sm font-semibold">{report.issuesBySeverity.medium}</span>
                  </div>
                  <Progress
                    value={(report.issuesBySeverity.medium / report.totalIssues) * 100}
                    className="h-1.5 bg-yellow-500/20"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-blue-500" />
                      <span>Low</span>
                    </div>
                    <span className="text-sm font-semibold">{report.issuesBySeverity.low}</span>
                  </div>
                  <Progress
                    value={(report.issuesBySeverity.low / report.totalIssues) * 100}
                    className="h-1.5 bg-blue-500/20"
                  />
                </div>
              </div>
            </Card>

            {/* Category Breakdown */}
            <Card className="p-4">
              <div className="text-sm font-medium mb-3">Issues by Category</div>
              <div className="space-y-2">
                {Object.entries(report.issuesByCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category as IssueCategory)}
                      <span className="capitalize">{category}</span>
                    </div>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tested URL */}
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Tested URL</div>
              <a
                href={report.baseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all flex items-start gap-1"
              >
                {report.baseUrl}
                <ExternalLink className="size-3 flex-shrink-0 mt-0.5" />
              </a>
            </Card>
          </aside>

          <main className="space-y-4">
            {/* Summary */}
            <Card className="p-5">
              <h2 className="text-lg font-semibold mb-2">Executive Summary</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{report.summary}</p>
            </Card>

            {report.crawlPath && report.pages && report.crawlPath.length > 0 && (
              <CrawlPathTree pages={report.pages} crawlPath={report.crawlPath} />
            )}

            {/* Tabbed Issues View */}
            <Card className="p-5">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-4">
                  <TabsTrigger value="all" className="text-xs">
                    All ({report.totalIssues})
                  </TabsTrigger>
                  <TabsTrigger value="critical" className="text-xs">
                    Critical ({report.issuesBySeverity.critical})
                  </TabsTrigger>
                  <TabsTrigger value="high" className="text-xs">
                    High ({report.issuesBySeverity.high})
                  </TabsTrigger>
                  <TabsTrigger value="medium" className="text-xs">
                    Medium ({report.issuesBySeverity.medium})
                  </TabsTrigger>
                  <TabsTrigger value="low" className="text-xs">
                    Low ({report.issuesBySeverity.low})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-2">
                  {report.issues.map((issue) => (
                    <Card
                      key={issue.id}
                      className="p-4 hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => toggleIssue(issue.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(issue.severity)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-medium text-sm leading-tight">{issue.title}</h3>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Badge variant="outline" className="text-xs capitalize">
                                {issue.severity}
                              </Badge>
                              {expandedIssues.has(issue.id) ? (
                                <ChevronUp className="size-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="size-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs capitalize gap-1">
                              {getCategoryIcon(issue.category)}
                              {issue.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground truncate">{issue.pageTitle}</span>
                          </div>
                          {expandedIssues.has(issue.id) && (
                            <div className="mt-3 space-y-3 pt-3 border-t border-border">
                              <p className="text-sm text-muted-foreground leading-relaxed">{issue.description}</p>
                              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                                <div className="text-xs font-medium text-primary mb-1">Recommendation</div>
                                <p className="text-sm leading-relaxed">{issue.recommendation}</p>
                              </div>
                              {issue.affectedElements && (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Affected: </span>
                                  <span>{issue.affectedElements}</span>
                                </div>
                              )}
                              <a
                                href={issue.pageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline font-mono flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {issue.pageUrl}
                                <ExternalLink className="size-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                {(["critical", "high", "medium", "low"] as const).map((severity) => (
                  <TabsContent key={severity} value={severity} className="space-y-2">
                    {issuesBySeverity[severity].length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle2 className="size-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No {severity} severity issues found.</p>
                      </div>
                    ) : (
                      issuesBySeverity[severity].map((issue) => (
                        <Card
                          key={issue.id}
                          className="p-4 hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => toggleIssue(issue.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(issue.severity)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-medium text-sm leading-tight">{issue.title}</h3>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Badge variant="outline" className="text-xs capitalize gap-1">
                                    {getCategoryIcon(issue.category)}
                                    {issue.category}
                                  </Badge>
                                  {expandedIssues.has(issue.id) ? (
                                    <ChevronUp className="size-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="size-4 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground truncate block">{issue.pageTitle}</span>
                              {expandedIssues.has(issue.id) && (
                                <div className="mt-3 space-y-3 pt-3 border-t border-border">
                                  <p className="text-sm text-muted-foreground leading-relaxed">{issue.description}</p>
                                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                                    <div className="text-xs font-medium text-primary mb-1">Recommendation</div>
                                    <p className="text-sm leading-relaxed">{issue.recommendation}</p>
                                  </div>
                                  {issue.affectedElements && (
                                    <div className="text-xs">
                                      <span className="text-muted-foreground">Affected: </span>
                                      <span>{issue.affectedElements}</span>
                                    </div>
                                  )}
                                  <a
                                    href={issue.pageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline font-mono flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {issue.pageUrl}
                                    <ExternalLink className="size-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </Card>
          </main>
        </div>
      </div>
    </div>
  )
}
