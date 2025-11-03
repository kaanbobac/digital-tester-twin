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
  discoveredFrom?: string
  linkText?: string
  discoveryMethod?: string
  depth: number
}

interface VisualAction {
  id: string
  type: "navigate" | "click" | "scroll" | "analyze" | "check"
  description: string
  url: string
  timestamp: number
  status: "success" | "error" | "warning"
  details?: string
  targetUrl?: string
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
  crawlPath: {
    url: string
    discoveredFrom: string
    linkText: string
    discoveryMethod: "html_link" | "meta_tag" | "redirect" | "initial"
    depth: number
    timestamp: number
  }[]
  actions?: VisualAction[]
}

// In-memory storage (in production, use a database)
const testStore = new Map<string, TestData>()

import { analyzeTestResults } from "./analyzer"

export async function crawlWebsite(url: string, testId: string) {
  const baseUrl = new URL(url).origin
  const visitedUrls = new Set<string>()
  const toVisit: {
    url: string
    discoveredFrom: string
    linkText: string
    discoveryMethod: "html_link" | "meta_tag" | "redirect" | "initial"
    depth: number
    timestamp: number
  }[] = [
    {
      url,
      discoveredFrom: "initial",
      linkText: "Starting URL",
      discoveryMethod: "initial",
      depth: 0,
      timestamp: Date.now(),
    },
  ]
  const pages: PageData[] = []
  const crawlPath: {
    url: string
    discoveredFrom: string
    linkText: string
    discoveryMethod: "html_link" | "meta_tag" | "redirect" | "initial"
    depth: number
    timestamp: number
  }[] = []

  const actions: VisualAction[] = []

  // Initialize test data
  testStore.set(testId, {
    testId,
    baseUrl,
    status: "crawling",
    progress: 0,
    pagesFound: 0,
    pages: [],
    startTime: Date.now(),
    crawlPath: [],
    actions: [], // Initialize actions array
  })

  const addAction = (action: Omit<VisualAction, "id" | "timestamp">) => {
    const newAction: VisualAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
    }
    actions.push(newAction)
    const testData = testStore.get(testId)!
    testData.actions = actions
    testStore.set(testId, testData)
    return newAction
  }

  try {
    addAction({
      type: "navigate",
      description: `Starting test on ${url}`,
      url,
      status: "success",
      details: "Initializing comprehensive website test",
    })

    // Crawl up to 20 pages
    const maxPages = 20

    while (toVisit.length > 0 && visitedUrls.size < maxPages) {
      const currentDiscovery = toVisit.shift()!
      const currentUrl = currentDiscovery.url

      if (visitedUrls.has(currentUrl)) continue
      visitedUrls.add(currentUrl)
      crawlPath.push(currentDiscovery)

      // Update status
      const testData = testStore.get(testId)!
      testData.currentPage = currentUrl
      testData.pagesFound = visitedUrls.size
      testData.progress = (visitedUrls.size / maxPages) * 50 // First 50% is crawling
      testData.crawlPath = crawlPath
      testStore.set(testId, testData)

      addAction({
        type: "navigate",
        description: `Navigating to page ${visitedUrls.size}/${maxPages}`,
        url: currentUrl,
        status: "success",
        details: currentDiscovery.linkText,
        targetUrl: currentUrl,
      })

      try {
        console.log(
          `[v0] Crawling: ${currentUrl} (discovered from: ${currentDiscovery.discoveredFrom}, method: ${currentDiscovery.discoveryMethod}, depth: ${currentDiscovery.depth})`,
        )

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch(currentUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; SiteAuditor/1.0; +https://siteauditor.com/bot)",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        console.log(`[v0] Response status for ${currentUrl}: ${response.status}`)

        const contentType = response.headers.get("content-type") || ""
        if (!contentType.includes("text/html")) {
          console.log(`[v0] Skipping non-HTML content: ${contentType}`)
          addAction({
            type: "check",
            description: "Skipped non-HTML content",
            url: currentUrl,
            status: "warning",
            details: `Content type: ${contentType}`,
          })
          pages.push({
            url: currentUrl,
            title: "Non-HTML Content",
            statusCode: response.status,
            links: [],
            errors: [`Content type is ${contentType}, expected HTML`],
            timestamp: Date.now(),
            visualIssues: [],
            consoleErrors: [],
            discoveredFrom: currentDiscovery.discoveredFrom,
            linkText: currentDiscovery.linkText,
            discoveryMethod: currentDiscovery.discoveryMethod,
            depth: currentDiscovery.depth,
          })
          continue
        }

        const html = await response.text()
        console.log(`[v0] Fetched ${html.length} bytes from ${currentUrl}`)

        addAction({
          type: "scroll",
          description: "Scrolling through page content",
          url: currentUrl,
          status: "success",
          details: `Analyzing ${Math.round(html.length / 1024)}KB of content`,
        })

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        const title = titleMatch ? titleMatch[1] : "Untitled"

        const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi
        const links: string[] = []
        let linkMatch
        let discoveredLinksCount = 0

        while ((linkMatch = linkRegex.exec(html)) !== null) {
          try {
            const linkUrl = linkMatch[1]
            const linkText = linkMatch[2].trim() || "(no text)"
            const link = new URL(linkUrl, currentUrl)

            // Only follow links on the same domain
            if (link.origin === baseUrl && !visitedUrls.has(link.href)) {
              links.push(link.href)

              const shouldCrawl =
                !link.href.match(/\.(css|js|jpg|jpeg|png|gif|svg|woff|woff2|ttf|ico|xml|json)$/i) &&
                !link.href.includes("/wp-json/oembed/") &&
                !link.href.includes("/feed/") &&
                !link.href.includes("/xmlrpc.php") &&
                !link.href.includes("?format=xml")

              if (shouldCrawl && !toVisit.some((d) => d.url === link.href)) {
                toVisit.push({
                  url: link.href,
                  discoveredFrom: currentUrl,
                  linkText: linkText.substring(0, 50), // Limit length
                  discoveryMethod: "html_link",
                  depth: currentDiscovery.depth + 1,
                  timestamp: Date.now(),
                })
                discoveredLinksCount++
                console.log(`[v0] Discovered link: "${linkText}" -> ${link.href}`)
              }
            }
          } catch {
            // Invalid URL, skip
          }
        }

        if (discoveredLinksCount > 0) {
          addAction({
            type: "click",
            description: `Found ${discoveredLinksCount} clickable links`,
            url: currentUrl,
            status: "success",
            details: `Discovered ${discoveredLinksCount} new pages to test`,
          })
        }

        const metaLinkRegex = /<link[^>]*href=["']([^"']+)["'][^>]*>/gi
        let metaMatch
        while ((metaMatch = metaLinkRegex.exec(html)) !== null) {
          try {
            const link = new URL(metaMatch[1], currentUrl)
            if (link.origin === baseUrl && !visitedUrls.has(link.href)) {
              // Only add HTML pages from meta tags, skip assets
              if (link.href.match(/\.(html|htm|php)$/i) || !link.href.match(/\./)) {
                if (!toVisit.some((d) => d.url === link.href)) {
                  toVisit.push({
                    url: link.href,
                    discoveredFrom: currentUrl,
                    linkText: "(meta tag)",
                    discoveryMethod: "meta_tag",
                    depth: currentDiscovery.depth + 1,
                    timestamp: Date.now(),
                  })
                }
              }
            }
          } catch {
            // Invalid URL, skip
          }
        }

        const errors: string[] = []
        if (response.status >= 400) {
          errors.push(`HTTP ${response.status} error`)
        }
        if (response.status === 200) {
          const titleLower = title.toLowerCase()
          const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
          const bodyText = bodyMatch ? bodyMatch[1].substring(0, 5000) : "" // First 5000 chars of body

          // Only flag as soft 404 if title or prominent body text suggests it's an error page
          if (
            (titleLower.includes("404") && titleLower.includes("not found")) ||
            titleLower === "404" ||
            titleLower === "not found" ||
            bodyText.includes("<h1>404</h1>") ||
            bodyText.includes("<h1>Not Found</h1>")
          ) {
            errors.push("Page may be a soft 404 (returns 200 but shows error content)")
          }
        }

        const visualIssues = analyzeVisualIssues(html)
        const consoleErrors = detectPotentialConsoleErrors(html)

        if (visualIssues.length > 0) {
          addAction({
            type: "analyze",
            description: `Checking accessibility`,
            url: currentUrl,
            status: visualIssues.length > 0 ? "warning" : "success",
            details: `Found ${visualIssues.length} accessibility issues`,
          })
        }

        const hasSEOIssues = !html.includes('name="description"') || !titleMatch
        addAction({
          type: "check",
          description: "Analyzing SEO elements",
          url: currentUrl,
          status: hasSEOIssues ? "warning" : "success",
          details: hasSEOIssues ? "Missing meta description or title" : "SEO elements present",
        })

        const buttonCount = (html.match(/<button/gi) || []).length
        const formCount = (html.match(/<form/gi) || []).length
        if (buttonCount > 0 || formCount > 0) {
          addAction({
            type: "click",
            description: `Testing interactive elements`,
            url: currentUrl,
            status: "success",
            details: `Found ${buttonCount} buttons and ${formCount} forms`,
          })
        }

        pages.push({
          url: currentUrl,
          title,
          statusCode: response.status,
          links: links.slice(0, 10),
          errors,
          timestamp: Date.now(),
          visualIssues,
          consoleErrors,
          discoveredFrom: currentDiscovery.discoveredFrom,
          linkText: currentDiscovery.linkText,
          discoveryMethod: currentDiscovery.discoveryMethod,
          depth: currentDiscovery.depth,
        })
      } catch (error) {
        console.error(`[v0] Error crawling ${currentUrl}:`, error)

        let errorMessage = "Failed to fetch page"
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            errorMessage = "Request timed out (10s limit)"
          } else if (error.message.includes("fetch")) {
            errorMessage = "Network error or CORS blocked"
          } else {
            errorMessage = error.message
          }
        }

        addAction({
          type: "check",
          description: `Failed to test page`,
          url: currentUrl,
          status: "error",
          details: errorMessage,
        })

        pages.push({
          url: currentUrl,
          title: "Error",
          statusCode: 0,
          links: [],
          errors: [errorMessage],
          timestamp: Date.now(),
          visualIssues: [],
          consoleErrors: [],
          discoveredFrom: currentDiscovery.discoveredFrom,
          linkText: currentDiscovery.linkText,
          discoveryMethod: currentDiscovery.discoveryMethod,
          depth: currentDiscovery.depth,
        })
      }

      // Small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    const successfulPages = pages.filter((p) => p.statusCode >= 200 && p.statusCode < 400)
    if (successfulPages.length === 0) {
      throw new Error(
        "Could not access any pages on this website. The site may have bot protection or CORS restrictions.",
      )
    }

    // Update to analyzing phase
    const testData = testStore.get(testId)!
    testData.status = "analyzing"
    testData.progress = 60
    testData.pages = pages
    testStore.set(testId, testData)

    addAction({
      type: "analyze",
      description: "Generating comprehensive report",
      url: baseUrl,
      status: "success",
      details: `Analyzed ${pages.length} pages with ${actions.length} total checks`,
    })

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
    testData.message = error instanceof Error ? error.message : "An error occurred during testing"
    testData.pages = pages // Include any pages we did manage to crawl
    testData.actions = actions // Include actions even on error
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

  // Check for missing form labels
  const inputs = html.match(/<input[^>]*>/gi) || []
  const labels = html.match(/<label[^>]*>/gi) || []
  if (inputs.length > labels.length && inputs.length > 0) {
    issues.push(`${inputs.length - labels.length} form inputs may be missing labels (accessibility issue)`)
  }

  // Check for missing ARIA labels on buttons
  const buttonsWithoutLabel = html.match(/<button(?![^>]*aria-label=)(?![^>]*>[\s\S]*?[a-zA-Z])[^>]*>/gi)
  if (buttonsWithoutLabel && buttonsWithoutLabel.length > 0) {
    issues.push(`${buttonsWithoutLabel.length} buttons may be missing accessible labels`)
  }

  // Check for proper heading hierarchy
  const h1Count = (html.match(/<h1[^>]*>/gi) || []).length
  if (h1Count === 0) {
    issues.push("Missing H1 heading (accessibility and SEO issue)")
  } else if (h1Count > 1) {
    issues.push(`Multiple H1 headings found (${h1Count}) - should only have one per page`)
  }

  // Check for missing language attribute
  if (!html.match(/<html[^>]*lang=/i)) {
    issues.push("Missing language attribute on HTML tag (accessibility issue)")
  }

  // Check for meta description
  if (!html.match(/<meta[^>]*name=["']description["'][^>]*>/i)) {
    issues.push("Missing meta description (SEO issue)")
  }

  // Check for meta description length
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
  if (metaDescMatch && metaDescMatch[1]) {
    const descLength = metaDescMatch[1].length
    if (descLength < 120) {
      issues.push(`Meta description too short (${descLength} chars, recommended 120-160)`)
    } else if (descLength > 160) {
      issues.push(`Meta description too long (${descLength} chars, recommended 120-160)`)
    }
  }

  // Check for Open Graph tags
  const hasOGTitle = html.includes('property="og:title"')
  const hasOGDescription = html.includes('property="og:description"')
  const hasOGImage = html.includes('property="og:image"')
  if (!hasOGTitle || !hasOGDescription || !hasOGImage) {
    issues.push("Missing Open Graph tags for social media sharing (SEO issue)")
  }

  // Check for canonical URL
  if (!html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i)) {
    issues.push("Missing canonical URL (SEO issue)")
  }

  // Check for inline styles (maintainability issue)
  const inlineStyles = html.match(/style=["'][^"']+["']/gi)
  if (inlineStyles && inlineStyles.length > 10) {
    issues.push(`Excessive inline styles detected (${inlineStyles.length} instances - UX/maintainability issue)`)
  }

  // Check for missing meta viewport (mobile responsiveness)
  if (!html.includes('name="viewport"')) {
    issues.push("Missing viewport meta tag (mobile responsiveness issue)")
  }

  // Check for small text
  const smallTextMatches = html.match(/font-size:\s*([0-9]+)px/gi) || []
  const smallTextCount = smallTextMatches.filter((match) => {
    const size = Number.parseInt(match.match(/([0-9]+)/)?.[1] || "16")
    return size < 12
  }).length
  if (smallTextCount > 0) {
    issues.push(`${smallTextCount} instances of very small text (< 12px) detected (UX issue)`)
  }

  // Check for empty links
  const emptyLinks = html.match(/<a[^>]*>\s*<\/a>/gi)
  if (emptyLinks && emptyLinks.length > 0) {
    issues.push(`${emptyLinks.length} empty links found (UX issue)`)
  }

  // Check for links without href
  const linksWithoutHref = html.match(/<a(?![^>]*href=)[^>]*>/gi)
  if (linksWithoutHref && linksWithoutHref.length > 0) {
    issues.push(`${linksWithoutHref.length} links missing href attribute (functionality issue)`)
  }

  // Check for broken image references
  const brokenImgSrc = html.match(/src=["'](data:image\/svg\+xml|#|javascript:)/gi)
  if (brokenImgSrc && brokenImgSrc.length > 0) {
    issues.push("Potentially broken image sources detected (functionality issue)")
  }

  // Check for forms without action
  const formsWithoutAction = html.match(/<form(?![^>]*action=)[^>]*>/gi)
  if (formsWithoutAction && formsWithoutAction.length > 0) {
    issues.push(`${formsWithoutAction.length} forms missing action attribute (functionality issue)`)
  }

  // Check for buttons without type
  const buttonsWithoutType = html.match(/<button(?![^>]*type=)[^>]*>/gi)
  if (buttonsWithoutType && buttonsWithoutType.length > 0) {
    issues.push(`${buttonsWithoutType.length} buttons missing type attribute (functionality issue)`)
  }

  // Check for inputs without type
  const inputsWithoutType = html.match(/<input(?![^>]*type=)[^>]*>/gi)
  if (inputsWithoutType && inputsWithoutType.length > 0) {
    issues.push(`${inputsWithoutType.length} inputs missing type attribute (functionality issue)`)
  }

  // Check for deprecated HTML tags
  const deprecatedTags = html.match(/<(font|center|marquee|blink|strike|big|tt)[^>]*>/gi)
  if (deprecatedTags && deprecatedTags.length > 0) {
    issues.push(`${deprecatedTags.length} deprecated HTML tags found (functionality/compatibility issue)`)
  }

  // Check for large inline scripts
  const scriptMatches = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || []
  const largeInlineScripts = scriptMatches.filter((script) => script.length > 10000).length
  if (largeInlineScripts > 0) {
    issues.push(`${largeInlineScripts} large inline scripts detected (performance issue)`)
  }

  // Check for excessive external scripts
  const externalScripts = html.match(/<script[^>]*src=/gi) || []
  if (externalScripts.length > 15) {
    issues.push(`${externalScripts.length} external scripts loaded (performance issue - consider bundling)`)
  }

  // Check for missing async/defer on scripts
  const scriptsWithoutAsync = html.match(/<script[^>]*src=(?![^>]*async)(?![^>]*defer)[^>]*>/gi)
  if (scriptsWithoutAsync && scriptsWithoutAsync.length > 3) {
    issues.push(`${scriptsWithoutAsync.length} scripts without async/defer (performance issue)`)
  }

  // Security checks
  // Check for mixed content (HTTP resources on HTTPS page)
  const httpResources = html.match(/src=["']http:\/\//gi) || html.match(/href=["']http:\/\//gi)
  if (httpResources && httpResources.length > 0) {
    issues.push(`${httpResources.length} HTTP resources on HTTPS page (security - mixed content warning)`)
  }

  // Check for inline event handlers (XSS risk)
  const inlineEvents = html.match(/on(click|load|error|mouseover)=["'][^"']*["']/gi)
  if (inlineEvents && inlineEvents.length > 5) {
    issues.push(`${inlineEvents.length} inline event handlers detected (security - potential XSS risk)`)
  }

  // Check for password fields without autocomplete
  const passwordFieldsWithoutAutocomplete = html.match(/<input[^>]*type=["']password["'](?![^>]*autocomplete=)[^>]*>/gi)
  if (passwordFieldsWithoutAutocomplete && passwordFieldsWithoutAutocomplete.length > 0) {
    issues.push(
      `${passwordFieldsWithoutAutocomplete.length} password fields without autocomplete attribute (security/UX issue)`,
    )
  }

  // Check for forms without HTTPS action
  const formsWithHttpAction = html.match(/<form[^>]*action=["']http:\/\/[^"']*["'][^>]*>/gi)
  if (formsWithHttpAction && formsWithHttpAction.length > 0) {
    issues.push(`${formsWithHttpAction.length} forms submitting to HTTP (security issue - use HTTPS)`)
  }

  // Performance checks
  // Check for render-blocking resources
  const renderBlockingCSS = html.match(/<link[^>]*rel=["']stylesheet["'](?![^>]*media=["']print["'])[^>]*>/gi)
  if (renderBlockingCSS && renderBlockingCSS.length > 5) {
    issues.push(`${renderBlockingCSS.length} render-blocking stylesheets (performance issue)`)
  }

  // Check for unoptimized images (no width/height)
  const imagesWithoutDimensions = html.match(/<img(?![^>]*width=)(?![^>]*height=)[^>]*>/gi)
  if (imagesWithoutDimensions && imagesWithoutDimensions.length > 3) {
    issues.push(`${imagesWithoutDimensions.length} images without dimensions (performance - layout shift issue)`)
  }

  // Check for large number of DOM elements
  const allTags = html.match(/<[^>]+>/g) || []
  if (allTags.length > 1500) {
    issues.push(`Large DOM size detected (${allTags.length} elements - performance issue)`)
  }

  // Check for synchronous scripts in head
  const syncScriptsInHead = html.match(/<head[\s\S]*?<script(?![^>]*async)(?![^>]*defer)[^>]*src=/gi)
  if (syncScriptsInHead && syncScriptsInHead.length > 0) {
    issues.push(`${syncScriptsInHead.length} synchronous scripts in <head> (performance - blocking issue)`)
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
  console.log("[v0] getAnalyzedReport called for testId:", testId)
  console.log("[v0] testStore size:", testStore.size)
  console.log("[v0] testStore keys:", Array.from(testStore.keys()))

  const testData = testStore.get(testId)

  console.log("[v0] testData found:", !!testData)
  if (testData) {
    console.log("[v0] testData status:", testData.status)
  }

  if (!testData || testData.status !== "complete") {
    console.log("[v0] Returning null - testData missing or not complete")
    return null
  }

  return analyzeTestResults(testData)
}
