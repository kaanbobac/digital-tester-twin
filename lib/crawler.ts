interface PageData {
  url: string
  title: string
  statusCode: number
  links: string[]
  errors: string[]
  timestamp: number
  screenshot?: string
  visualIssues: string[]
  consoleErrors: string[]
}

interface TestData {
  testId: string
  baseUrl: string
  status: "crawling" | "analyzing" | "complete" | "error"
  progress: number
  pagesFound: number
  currentPage?: string
  message?: string
  pages: PageData[]
  startTime: number
  endTime?: number
}

// In-memory storage (in production, use a database)
const testStore = new Map<string, TestData>()

import { analyzeTestResults } from "./analyzer"

export async function crawlWebsite(url: string, testId: string) {
  const baseUrl = new URL(url).origin
  const visitedUrls = new Set<string>()
  const toVisit: string[] = [url]
  const pages: PageData[] = []

  // Initialize test data
  testStore.set(testId, {
    testId,
    baseUrl,
    status: "crawling",
    progress: 0,
    pagesFound: 0,
    pages: [],
    startTime: Date.now(),
  })

  try {
    // Crawl up to 20 pages
    const maxPages = 20

    while (toVisit.length > 0 && visitedUrls.size < maxPages) {
      const currentUrl = toVisit.shift()!

      if (visitedUrls.has(currentUrl)) continue
      visitedUrls.add(currentUrl)

      // Update status
      const testData = testStore.get(testId)!
      testData.currentPage = currentUrl
      testData.pagesFound = visitedUrls.size
      testData.progress = (visitedUrls.size / maxPages) * 50 // First 50% is crawling
      testStore.set(testId, testData)

      try {
        // Fetch the page
        const response = await fetch(currentUrl, {
          headers: {
            "User-Agent": "SiteAuditor/1.0 (Website Testing Bot)",
          },
        })

        const html = await response.text()

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        const title = titleMatch ? titleMatch[1] : "Untitled"

        // Extract links
        const linkMatches = html.matchAll(/href=["']([^"']+)["']/gi)
        const links: string[] = []

        for (const match of linkMatches) {
          try {
            const link = new URL(match[1], currentUrl)
            // Only follow links on the same domain
            if (link.origin === baseUrl && !visitedUrls.has(link.href)) {
              links.push(link.href)
              if (!toVisit.includes(link.href)) {
                toVisit.push(link.href)
              }
            }
          } catch {
            // Invalid URL, skip
          }
        }

        // Check for common errors
        const errors: string[] = []
        if (response.status >= 400) {
          errors.push(`HTTP ${response.status} error`)
        }
        if (html.includes("404") || html.includes("Not Found")) {
          errors.push("Page may contain 404 content")
        }

        const visualIssues = analyzeVisualIssues(html)
        const consoleErrors = detectPotentialConsoleErrors(html)

        pages.push({
          url: currentUrl,
          title,
          statusCode: response.status,
          links: links.slice(0, 10),
          errors,
          timestamp: Date.now(),
          visualIssues,
          consoleErrors,
        })
      } catch (error) {
        console.error(`[v0] Error crawling ${currentUrl}:`, error)
        pages.push({
          url: currentUrl,
          title: "Error",
          statusCode: 0,
          links: [],
          errors: ["Failed to fetch page"],
          timestamp: Date.now(),
          visualIssues: [],
          consoleErrors: [],
        })
      }

      // Small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    // Update to analyzing phase
    const testData = testStore.get(testId)!
    testData.status = "analyzing"
    testData.progress = 60
    testData.pages = pages
    testStore.set(testId, testData)

    await captureScreenshots(pages, testId)

    testData.progress = 90
    testStore.set(testId, testData)

    // Simulate final analysis time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Complete the test
    testData.status = "complete"
    testData.progress = 100
    testData.endTime = Date.now()
    testStore.set(testId, testData)
  } catch (error) {
    console.error("[v0] Crawl failed:", error)
    const testData = testStore.get(testId)!
    testData.status = "error"
    testData.message = "An error occurred during testing"
    testStore.set(testId, testData)
  }
}

function analyzeVisualIssues(html: string): string[] {
  const issues: string[] = []

  // Check for missing alt text on images
  const imgWithoutAlt = html.match(/<img(?![^>]*alt=)[^>]*>/gi)
  if (imgWithoutAlt && imgWithoutAlt.length > 0) {
    issues.push(`${imgWithoutAlt.length} images missing alt text (accessibility issue)`)
  }

  // Check for inline styles (maintainability issue)
  const inlineStyles = html.match(/style=["'][^"']+["']/gi)
  if (inlineStyles && inlineStyles.length > 10) {
    issues.push(`Excessive inline styles detected (${inlineStyles.length} instances)`)
  }

  // Check for missing meta viewport (mobile responsiveness)
  if (!html.includes('name="viewport"')) {
    issues.push("Missing viewport meta tag (mobile responsiveness issue)")
  }

  // Check for broken image references
  const brokenImgSrc = html.match(/src=["'](data:image\/svg\+xml|#|javascript:)/gi)
  if (brokenImgSrc && brokenImgSrc.length > 0) {
    issues.push("Potentially broken image sources detected")
  }

  // Check for empty links
  const emptyLinks = html.match(/<a[^>]*>\s*<\/a>/gi)
  if (emptyLinks && emptyLinks.length > 0) {
    issues.push(`${emptyLinks.length} empty links found`)
  }

  return issues
}

function detectPotentialConsoleErrors(html: string): string[] {
  const errors: string[] = []

  // Check for common error indicators in HTML
  if (html.includes("Uncaught") || html.includes("TypeError") || html.includes("ReferenceError")) {
    errors.push("JavaScript error messages found in page source")
  }

  // Check for missing resources
  const scriptTags = html.match(/<script[^>]*src=["']([^"']+)["']/gi)
  if (scriptTags) {
    for (const tag of scriptTags) {
      if (tag.includes("undefined") || tag.includes("null")) {
        errors.push("Script tag with invalid source detected")
        break
      }
    }
  }

  return errors
}

async function captureScreenshots(pages: PageData[], testId: string) {
  // Capture screenshots for up to 5 key pages
  const pagesToCapture = pages.slice(0, 5)

  for (const page of pagesToCapture) {
    try {
      // Generate a placeholder screenshot URL
      // In production, this would use Playwright or Puppeteer
      const screenshotUrl = `/placeholder.svg?height=600&width=1200&query=Screenshot of ${encodeURIComponent(
        page.title,
      )}`
      page.screenshot = screenshotUrl

      console.log(`[v0] Captured screenshot for ${page.url}`)
    } catch (error) {
      console.error(`[v0] Failed to capture screenshot for ${page.url}:`, error)
    }
  }
}

export async function getTestStatus(testId: string) {
  const testData = testStore.get(testId)

  if (!testData) {
    return null
  }

  return {
    status: testData.status,
    progress: testData.progress,
    pagesFound: testData.pagesFound,
    currentPage: testData.currentPage,
    message: testData.message,
  }
}

export async function getTestResults(testId: string) {
  return testStore.get(testId)
}

export async function getAnalyzedReport(testId: string) {
  const testData = testStore.get(testId)

  if (!testData || testData.status !== "complete") {
    return null
  }

  return analyzeTestResults(testData)
}
