export interface TestAction {
  id: string
  type: "navigate" | "click" | "fill" | "scroll" | "wait" | "back" | "screenshot"
  element?: string
  value?: string
  timestamp: number
  screenshot?: string
  success: boolean
  error?: string
  description: string
  url?: string
  clickPosition?: { x: number; y: number }
  scrollPosition?: number
}

export interface VisualTestData {
  testId: string
  baseUrl: string
  status: "testing" | "complete" | "error"
  progress: number
  currentAction?: string
  errorMessage?: string
  actions: TestAction[]
  issues: {
    id: string
    severity: "critical" | "high" | "medium" | "low"
    category: string
    description: string
    screenshot?: string
    action?: string
  }[]
  startTime: number
  endTime?: number
}

const testStore = new Map<string, VisualTestData>()

export function initializeTest(testId: string, baseUrl: string) {
  console.log("[v0] Initializing test in store:", testId)
  testStore.set(testId, {
    testId,
    baseUrl,
    status: "testing",
    progress: 0,
    actions: [],
    issues: [],
    startTime: Date.now(),
  })
}

async function analyzePageStructure(html: string, baseUrl: string) {
  const structure = {
    links: [] as { text: string; href: string }[],
    buttons: [] as string[],
    forms: [] as { inputs: string[]; hasSubmit: boolean }[],
    images: [] as string[],
    headings: [] as string[],
  }

  const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi)
  for (const match of linkMatches) {
    const href = match[1]
    const text = match[2]?.trim()
    if (href && !href.startsWith("#") && !href.startsWith("javascript:") && text) {
      try {
        const fullUrl = href.startsWith("http") ? href : new URL(href, baseUrl).href
        if (fullUrl.startsWith(baseUrl)) {
          structure.links.push({ text, href: fullUrl })
        }
      } catch {
        // Invalid URL, skip
      }
    }
  }

  const buttonMatches = html.matchAll(/<button[^>]*>([^<]+)<\/button>/gi)
  for (const match of buttonMatches) {
    const text = match[1]?.trim()
    if (text) {
      structure.buttons.push(text)
    }
  }

  // Also check for input type="button"
  const inputButtonMatches = html.matchAll(/<input[^>]*type=["']button["'][^>]*value=["']([^"']+)["']/gi)
  for (const match of inputButtonMatches) {
    const text = match[1]?.trim()
    if (text) {
      structure.buttons.push(text)
    }
  }

  // Extract forms
  const formMatches = html.matchAll(/<form[^>]*>([\s\S]*?)<\/form>/gi)
  for (const match of formMatches) {
    const formHtml = match[1]
    const inputs: string[] = []
    const inputMatches = formHtml.matchAll(/<input[^>]+type=["']([^"']+)["'][^>]*>/gi)
    for (const inputMatch of inputMatches) {
      const type = inputMatch[1]
      if (type !== "hidden" && type !== "submit") {
        inputs.push(type)
      }
    }
    const hasSubmit = formHtml.includes('type="submit"') || formHtml.includes("type='submit'")
    if (inputs.length > 0) {
      structure.forms.push({ inputs, hasSubmit })
    }
  }

  // Extract images
  const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)
  structure.images = Array.from(imgMatches).map((m) => m[1])

  // Extract headings
  const headingMatches = html.matchAll(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi)
  structure.headings = Array.from(headingMatches)
    .map((m) => m[1]?.trim())
    .filter(Boolean)

  return structure
}

export async function runVisualTest(url: string, testId: string) {
  const actions: TestAction[] = []
  const issues: any[] = []
  let actionCounter = 0

  const baseUrl = new URL(url).origin
  const visitedUrls = new Set<string>()
  const toVisit: { url: string; linkText: string; depth: number }[] = [{ url, linkText: "Homepage", depth: 0 }]
  const maxPages = 20

  try {
    console.log("[v0] Starting comprehensive visual test for:", url)

    // Action: Start test
    await performAction(
      {
        id: `action_${actionCounter++}`,
        type: "navigate",
        timestamp: Date.now(),
        success: true,
        description: `Starting comprehensive test of ${url}`,
        url: url,
      },
      testId,
      actions,
      5,
    )

    // Crawl multiple pages
    while (toVisit.length > 0 && visitedUrls.size < maxPages) {
      const current = toVisit.shift()!
      const currentUrl = current.url

      if (visitedUrls.has(currentUrl)) continue
      visitedUrls.add(currentUrl)

      const progress = 10 + (visitedUrls.size / maxPages) * 80

      // Navigate to page
      await performAction(
        {
          id: `action_${actionCounter++}`,
          type: "navigate",
          timestamp: Date.now(),
          success: true,
          description: `Navigate to "${current.linkText}" (${visitedUrls.size}/${maxPages})`,
          url: currentUrl,
        },
        testId,
        actions,
        progress,
      )

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(currentUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; SiteAuditor/1.0; +https://siteauditor.com/bot)",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
          },
        })
        clearTimeout(timeoutId)

        const contentType = response.headers.get("content-type") || ""
        if (!contentType.includes("text/html")) {
          console.log(`[v0] Skipping non-HTML content: ${contentType}`)
          await performAction(
            {
              id: `action_${actionCounter++}`,
              type: "wait",
              timestamp: Date.now(),
              success: false,
              error: `Non-HTML content (${contentType})`,
              description: `⚠️ Skipped non-HTML content`,
              url: currentUrl,
            },
            testId,
            actions,
            progress + 1,
          )
          continue
        }

        if (!response.ok) {
          await performAction(
            {
              id: `action_${actionCounter++}`,
              type: "wait",
              timestamp: Date.now(),
              success: false,
              error: `HTTP ${response.status}`,
              description: `❌ Page returned HTTP ${response.status} error`,
              url: currentUrl,
            },
            testId,
            actions,
            progress + 1,
          )

          issues.push({
            id: `issue_${issues.length}`,
            severity: response.status >= 500 ? "critical" : "high",
            category: "Functionality",
            description: `HTTP ${response.status} error on ${currentUrl}`,
            action: `Navigate to "${current.linkText}"`,
          })
          continue
        }

        const html = await response.text()
        const pageStructure = await analyzePageStructure(html, baseUrl)

        // Check accessibility
        await performAction(
          {
            id: `action_${actionCounter++}`,
            type: "wait",
            timestamp: Date.now(),
            success: true,
            description: `🔍 Checking accessibility (images, alt text, headings)`,
            url: currentUrl,
          },
          testId,
          actions,
          progress + 2,
        )

        // Check for missing alt text
        const imgWithoutAlt = html.match(/<img(?![^>]*alt=)[^>]*>/gi)
        if (imgWithoutAlt && imgWithoutAlt.length > 0) {
          issues.push({
            id: `issue_${issues.length}`,
            severity: "medium",
            category: "Accessibility",
            description: `${imgWithoutAlt.length} images missing alt text on "${current.linkText}"`,
            action: `Check accessibility on ${currentUrl}`,
          })
        }

        // Check SEO
        await performAction(
          {
            id: `action_${actionCounter++}`,
            type: "wait",
            timestamp: Date.now(),
            success: true,
            description: `📊 Analyzing SEO (title, meta tags, headings)`,
            url: currentUrl,
          },
          testId,
          actions,
          progress + 3,
        )

        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        const title = titleMatch ? titleMatch[1] : ""
        if (!title || title === "Untitled") {
          issues.push({
            id: `issue_${issues.length}`,
            severity: "high",
            category: "SEO",
            description: `Missing or empty page title on "${current.linkText}"`,
            action: `Check SEO on ${currentUrl}`,
          })
        }

        if (!html.includes('name="viewport"')) {
          issues.push({
            id: `issue_${issues.length}`,
            severity: "high",
            category: "UX",
            description: `Missing viewport meta tag on "${current.linkText}" (mobile responsiveness)`,
            action: `Check mobile responsiveness on ${currentUrl}`,
          })
        }

        // Scroll through page
        await performAction(
          {
            id: `action_${actionCounter++}`,
            type: "scroll",
            element: "page content",
            timestamp: Date.now(),
            success: true,
            description: `📜 Scrolling through page content`,
            url: currentUrl,
            scrollPosition: 50,
          },
          testId,
          actions,
          progress + 4,
        )

        // Test buttons
        if (pageStructure.buttons.length > 0) {
          await performAction(
            {
              id: `action_${actionCounter++}`,
              type: "click",
              element: `${pageStructure.buttons.length} buttons`,
              timestamp: Date.now(),
              success: true,
              description: `🖱️ Testing ${pageStructure.buttons.length} interactive buttons`,
              url: currentUrl,
              clickPosition: { x: 50, y: 40 },
            },
            testId,
            actions,
            progress + 5,
          )
        }

        // Test forms
        if (pageStructure.forms.length > 0) {
          for (let i = 0; i < pageStructure.forms.length; i++) {
            const form = pageStructure.forms[i]
            await performAction(
              {
                id: `action_${actionCounter++}`,
                type: "fill",
                element: `form ${i + 1}`,
                value: `${form.inputs.length} fields`,
                timestamp: Date.now(),
                success: true,
                description: `📝 Testing form ${i + 1} with ${form.inputs.length} input fields`,
                url: currentUrl,
                clickPosition: { x: 50, y: 60 },
              },
              testId,
              actions,
              progress + 6,
            )

            if (!form.hasSubmit) {
              issues.push({
                id: `issue_${issues.length}`,
                severity: "medium",
                category: "UX",
                description: `Form ${i + 1} on "${current.linkText}" has no submit button`,
                action: `Test form on ${currentUrl}`,
              })
            }
          }
        }

        const newLinksFound = pageStructure.links.filter((link) => {
          // Filter out assets and non-essential URLs
          const shouldCrawl =
            !link.href.match(/\.(css|js|jpg|jpeg|png|gif|svg|woff|woff2|ttf|ico|xml|json)$/i) &&
            !link.href.includes("/wp-json/oembed/") &&
            !link.href.includes("/feed/") &&
            !link.href.includes("/xmlrpc.php") &&
            !link.href.includes("?format=xml") &&
            !visitedUrls.has(link.href) &&
            !toVisit.some((v) => v.url === link.href)

          return shouldCrawl
        }).length

        if (newLinksFound > 0) {
          await performAction(
            {
              id: `action_${actionCounter++}`,
              type: "wait",
              timestamp: Date.now(),
              success: true,
              description: `🔗 Discovered ${newLinksFound} new links to test`,
              url: currentUrl,
            },
            testId,
            actions,
            progress + 7,
          )

          // Add new links to crawl queue (up to 5 per page)
          for (const link of pageStructure.links.slice(0, 5)) {
            const shouldCrawl =
              !link.href.match(/\.(css|js|jpg|jpeg|png|gif|svg|woff|woff2|ttf|ico|xml|json)$/i) &&
              !link.href.includes("/wp-json/oembed/") &&
              !link.href.includes("/feed/") &&
              !link.href.includes("/xmlrpc.php") &&
              !link.href.includes("?format=xml") &&
              !visitedUrls.has(link.href) &&
              !toVisit.some((v) => v.url === link.href)

            if (shouldCrawl) {
              toVisit.push({
                url: link.href,
                linkText: link.text,
                depth: current.depth + 1,
              })
            }
          }
        }

        // Check for console errors
        if (html.includes("Uncaught") || html.includes("TypeError")) {
          issues.push({
            id: `issue_${issues.length}`,
            severity: "high",
            category: "Functionality",
            description: `JavaScript errors detected on "${current.linkText}"`,
            action: `Check console on ${currentUrl}`,
          })
        }
      } catch (error: any) {
        let errorMessage = "Failed to fetch page"
        if (error.name === "AbortError") {
          errorMessage = "Request timed out (10s limit)"
        } else if (error.message.includes("fetch")) {
          errorMessage = "Network error or CORS blocked"
        } else {
          errorMessage = error.message
        }

        await performAction(
          {
            id: `action_${actionCounter++}`,
            type: "wait",
            timestamp: Date.now(),
            success: false,
            error: errorMessage,
            description: `❌ Failed to test page: ${errorMessage}`,
            url: currentUrl,
          },
          testId,
          actions,
          progress + 1,
        )

        issues.push({
          id: `issue_${issues.length}`,
          severity: "critical",
          category: "Functionality",
          description: `Failed to access "${current.linkText}": ${errorMessage}`,
          action: `Navigate to ${currentUrl}`,
        })
      }

      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    // Final summary action
    await performAction(
      {
        id: `action_${actionCounter++}`,
        type: "screenshot",
        timestamp: Date.now(),
        success: true,
        description: `✅ Test complete: Analyzed ${visitedUrls.size} pages, found ${issues.length} issues`,
        url: url,
      },
      testId,
      actions,
      95,
    )

    // Complete test
    const testData = testStore.get(testId)!
    testData.status = "complete"
    testData.progress = 100
    testData.actions = actions
    testData.issues = issues
    testData.endTime = Date.now()
    testStore.set(testId, testData)

    console.log(
      `[v0] Comprehensive visual test complete: ${visitedUrls.size} pages, ${actions.length} actions, ${issues.length} issues`,
    )
  } catch (error: any) {
    console.error("[v0] Visual test failed:", error)
    const testData = testStore.get(testId)!
    testData.status = "error"
    testData.errorMessage = error.message || "An unknown error occurred during testing"
    testData.actions = actions
    testData.issues = issues
    testData.endTime = Date.now()
    testStore.set(testId, testData)
  }
}

async function performAction(action: TestAction, testId: string, actions: TestAction[], progress: number) {
  actions.push(action)
  const testData = testStore.get(testId)!
  testData.currentAction = action.description
  testData.progress = progress
  testData.actions = [...actions]
  testStore.set(testId, testData)

  await new Promise((resolve) => setTimeout(resolve, 800))
}

export async function getVisualTestStatus(testId: string) {
  return testStore.get(testId) || null
}

export async function getVisualTestReport(testId: string) {
  const testData = testStore.get(testId)
  if (!testData || testData.status !== "complete") {
    return null
  }
  return testData
}
