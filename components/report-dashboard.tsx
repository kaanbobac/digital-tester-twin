"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Home,
  Download,
  Filter,
  Bug,
  Eye,
  Zap,
  Search,
  Shield,
  Accessibility,
} from "lucide-react"
import Link from "next/link"
import type { AnalysisReport, IssueSeverity, IssueCategory } from "@/lib/analyzer"

interface ReportDashboardProps {
  report: AnalysisReport
}

export function ReportDashboard({ report }: ReportDashboardProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<IssueSeverity | "all">("all")
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | "all">("all")

  const filteredIssues = report.issues.filter((issue) => {
    if (selectedSeverity !== "all" && issue.severity !== selectedSeverity) return false
    if (selectedCategory !== "all" && issue.category !== selectedCategory) return false
    return true
  })

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

  const getSeverityColor = (severity: IssueSeverity) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "default"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                <Bug className="size-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">SiteAuditor</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">Test Report</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export PDF
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

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Summary Section */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Test Report</h1>
            <p className="text-muted-foreground">{report.baseUrl}</p>
          </div>

          <Card className="p-6">
            <p className="text-base leading-relaxed">{report.summary}</p>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Pages Tested</div>
            <div className="text-2xl font-bold">{report.totalPages}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Issues</div>
            <div className="text-2xl font-bold">{report.totalIssues}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Critical Issues</div>
            <div className="text-2xl font-bold text-destructive">{report.issuesBySeverity.critical}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Test Duration</div>
            <div className="text-2xl font-bold">{formatDuration(report.testDuration)}</div>
          </Card>
        </div>

        {/* Severity Breakdown */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Issues by Severity</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="size-5 text-destructive" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Critical</div>
                <div className="text-xl font-semibold">{report.issuesBySeverity.critical}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <AlertTriangle className="size-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">High</div>
                <div className="text-xl font-semibold">{report.issuesBySeverity.high}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Info className="size-5 text-accent" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Medium</div>
                <div className="text-xl font-semibold">{report.issuesBySeverity.medium}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                <CheckCircle2 className="size-5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Low</div>
                <div className="text-xl font-semibold">{report.issuesBySeverity.low}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Category Breakdown */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Issues by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(report.issuesByCategory).map(([category, count]) => (
              <div key={category} className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  {getCategoryIcon(category as IssueCategory)}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground capitalize">{category}</div>
                  <div className="text-xl font-semibold">{count}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Issues List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">All Issues</h2>
            <div className="flex items-center gap-3">
              <Filter className="size-4 text-muted-foreground" />
              <Select value={selectedSeverity} onValueChange={(v) => setSelectedSeverity(v as any)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="functionality">Functionality</SelectItem>
                  <SelectItem value="accessibility">Accessibility</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="seo">SEO</SelectItem>
                  <SelectItem value="ux">UX</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="size-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No issues found with the selected filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIssues.map((issue) => (
                <Card key={issue.id} className="p-5 hover:border-primary/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">{getSeverityIcon(issue.severity)}</div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{issue.title}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getSeverityColor(issue.severity)} className="capitalize">
                              {issue.severity}
                            </Badge>
                            <Badge variant="outline" className="capitalize gap-1">
                              {getCategoryIcon(issue.category)}
                              {issue.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{issue.description}</p>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <div className="text-xs text-muted-foreground mb-1">Recommendation:</div>
                        <p className="text-sm leading-relaxed">{issue.recommendation}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Page: </span>
                          <span className="font-mono text-xs">{issue.pageTitle}</span>
                        </div>
                        {issue.affectedElements && (
                          <div>
                            <span className="text-muted-foreground">Affected: </span>
                            <span className="text-xs">{issue.affectedElements}</span>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t border-border">
                        <a
                          href={issue.pageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline font-mono"
                        >
                          {issue.pageUrl}
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
