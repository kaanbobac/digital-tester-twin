export type IssueSeverity = "critical" | "high" | "medium" | "low"
export type IssueCategory = "functionality" | "accessibility" | "performance" | "seo" | "ux" | "security"

export interface Issue {
  id: string
  title: string
  description: string
  severity: IssueSeverity
  category: IssueCategory
  pageUrl: string
  pageTitle: string
  recommendation: string
  affectedElements?: string
}

export interface AnalysisReport {
  testId: string
  baseUrl: string
  totalPages: number
  totalIssues: number
  issuesBySeverity: {
    critical: number
    high: number
    medium: number
    low: number
  }
  issuesByCategory: {
    functionality: number
    accessibility: number
    performance: number
    seo: number
    ux: number
    security: number
  }
  issues: Issue[]
  summary: string
  testDuration: number
}

export function analyzeTestResults(testData: {
  testId: string
  baseUrl: string
  pages: Array<{
    url: string
    title: string
    statusCode: number
    errors: string[]
    visualIssues: string[]
    consoleErrors: string[]
    links: string[]
  }>
  startTime: number
  endTime?: number
}): AnalysisReport {
  const issues: Issue[] = []
  let issueCounter = 0

  // Analyze each page
  for (const page of testData.pages) {
    // Check for HTTP errors
    if (page.statusCode >= 400) {
      issues.push({
        id: `issue_${issueCounter++}`,
        title: `HTTP ${page.statusCode} Error`,
        description: `Page returned HTTP status code ${page.statusCode}, indicating the page is not accessible.`,
        severity: page.statusCode >= 500 ? "critical" : "high",
        category: "functionality",
        pageUrl: page.url,
        pageTitle: page.title,
        recommendation:
          page.statusCode === 404
            ? "Fix broken links or redirect this URL to a valid page."
            : "Investigate server errors and ensure the page loads correctly.",
      })
    }

    // Check for page errors
    for (const error of page.errors) {
      if (error.includes("Failed to fetch")) {
        issues.push({
          id: `issue_${issueCounter++}`,
          title: "Page Failed to Load",
          description: `Unable to fetch the page content. This could indicate network issues or server problems.`,
          severity: "critical",
          category: "functionality",
          pageUrl: page.url,
          pageTitle: page.title,
          recommendation: "Check server configuration and ensure the page is accessible.",
        })
      } else if (error.includes("404")) {
        issues.push({
          id: `issue_${issueCounter++}`,
          title: "404 Content Detected",
          description: "Page contains '404' or 'Not Found' text, suggesting broken content.",
          severity: "high",
          category: "functionality",
          pageUrl: page.url,
          pageTitle: page.title,
          recommendation: "Review page content and fix broken links or missing resources.",
        })
      }
    }

    // Check for visual issues
    for (const visualIssue of page.visualIssues) {
      if (visualIssue.includes("alt text")) {
        issues.push({
          id: `issue_${issueCounter++}`,
          title: "Missing Image Alt Text",
          description: visualIssue,
          severity: "medium",
          category: "accessibility",
          pageUrl: page.url,
          pageTitle: page.title,
          recommendation: "Add descriptive alt text to all images for screen reader users and SEO benefits.",
          affectedElements: "Images",
        })
      } else if (visualIssue.includes("viewport")) {
        issues.push({
          id: `issue_${issueCounter++}`,
          title: "Missing Viewport Meta Tag",
          description: visualIssue,
          severity: "high",
          category: "ux",
          pageUrl: page.url,
          pageTitle: page.title,
          recommendation:
            'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head> section.',
        })
      } else if (visualIssue.includes("inline styles")) {
        issues.push({
          id: `issue_${issueCounter++}`,
          title: "Excessive Inline Styles",
          description: visualIssue,
          severity: "low",
          category: "performance",
          pageUrl: page.url,
          pageTitle: page.title,
          recommendation: "Move inline styles to CSS files for better maintainability and caching.",
        })
      } else if (visualIssue.includes("empty links")) {
        issues.push({
          id: `issue_${issueCounter++}`,
          title: "Empty Links Found",
          description: visualIssue,
          severity: "medium",
          category: "ux",
          pageUrl: page.url,
          pageTitle: page.title,
          recommendation: "Remove empty links or add meaningful content and labels.",
        })
      } else if (visualIssue.includes("broken image")) {
        issues.push({
          id: `issue_${issueCounter++}`,
          title: "Broken Image Sources",
          description: visualIssue,
          severity: "medium",
          category: "functionality",
          pageUrl: page.url,
          pageTitle: page.title,
          recommendation: "Fix image source URLs to point to valid image files.",
        })
      }
    }

    // Check for console errors
    for (const consoleError of page.consoleErrors) {
      if (consoleError.includes("JavaScript error")) {
        issues.push({
          id: `issue_${issueCounter++}`,
          title: "JavaScript Errors Detected",
          description: consoleError,
          severity: "high",
          category: "functionality",
          pageUrl: page.url,
          pageTitle: page.title,
          recommendation: "Review browser console and fix JavaScript errors to ensure proper functionality.",
        })
      } else if (consoleError.includes("invalid source")) {
        issues.push({
          id: `issue_${issueCounter++}`,
          title: "Invalid Script Source",
          description: consoleError,
          severity: "high",
          category: "functionality",
          pageUrl: page.url,
          pageTitle: page.title,
          recommendation: "Fix script tag sources to point to valid JavaScript files.",
        })
      }
    }

    // Check for SEO issues
    if (page.title === "Untitled" || page.title.length === 0) {
      issues.push({
        id: `issue_${issueCounter++}`,
        title: "Missing Page Title",
        description: "Page is missing a title tag, which is crucial for SEO and user experience.",
        severity: "high",
        category: "seo",
        pageUrl: page.url,
        pageTitle: page.title,
        recommendation: "Add a descriptive, unique title tag to every page (50-60 characters recommended).",
      })
    }

    // Check for broken links
    if (page.links.length === 0 && page.statusCode === 200) {
      issues.push({
        id: `issue_${issueCounter++}`,
        title: "No Internal Links Found",
        description: "Page has no internal links, which may indicate poor navigation or a dead-end page.",
        severity: "low",
        category: "ux",
        pageUrl: page.url,
        pageTitle: page.title,
        recommendation: "Add navigation links to help users explore your site and improve SEO.",
      })
    }
  }

  // Calculate statistics
  const issuesBySeverity = {
    critical: issues.filter((i) => i.severity === "critical").length,
    high: issues.filter((i) => i.severity === "high").length,
    medium: issues.filter((i) => i.severity === "medium").length,
    low: issues.filter((i) => i.severity === "low").length,
  }

  const issuesByCategory = {
    functionality: issues.filter((i) => i.category === "functionality").length,
    accessibility: issues.filter((i) => i.category === "accessibility").length,
    performance: issues.filter((i) => i.category === "performance").length,
    seo: issues.filter((i) => i.category === "seo").length,
    ux: issues.filter((i) => i.category === "ux").length,
    security: issues.filter((i) => i.category === "security").length,
  }

  // Generate summary
  const summary = generateSummary(testData.pages.length, issues, issuesBySeverity)

  return {
    testId: testData.testId,
    baseUrl: testData.baseUrl,
    totalPages: testData.pages.length,
    totalIssues: issues.length,
    issuesBySeverity,
    issuesByCategory,
    issues,
    summary,
    testDuration: testData.endTime ? testData.endTime - testData.startTime : 0,
  }
}

function generateSummary(
  totalPages: number,
  issues: Issue[],
  issuesBySeverity: { critical: number; high: number; medium: number; low: number },
): string {
  if (issues.length === 0) {
    return `Great news! We tested ${totalPages} pages and found no significant issues. Your website appears to be in excellent shape.`
  }

  const criticalCount = issuesBySeverity.critical
  const highCount = issuesBySeverity.high

  if (criticalCount > 0) {
    return `We found ${issues.length} issues across ${totalPages} pages, including ${criticalCount} critical ${
      criticalCount === 1 ? "issue" : "issues"
    } that require immediate attention. Focus on resolving critical issues first to ensure your website functions properly.`
  }

  if (highCount > 0) {
    return `We found ${issues.length} issues across ${totalPages} pages, including ${highCount} high-priority ${
      highCount === 1 ? "issue" : "issues"
    }. Addressing these will significantly improve your website's quality and user experience.`
  }

  return `We found ${issues.length} minor issues across ${totalPages} pages. While none are critical, addressing these will help polish your website and improve the overall user experience.`
}
