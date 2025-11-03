"use client"

import { ChevronRight, ExternalLink, LinkIcon, FileCode, Hash } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

interface URLDiscovery {
  url: string
  discoveredFrom: string
  linkText: string
  discoveryMethod: "html_link" | "meta_tag" | "redirect" | "initial"
  depth: number
  timestamp: number
}

interface PageData {
  url: string
  title: string
  statusCode: number
  discoveredFrom?: string
  linkText?: string
  discoveryMethod?: string
  depth: number
}

interface CrawlPathTreeProps {
  pages: PageData[]
  crawlPath: URLDiscovery[]
}

export function CrawlPathTree({ pages, crawlPath }: CrawlPathTreeProps) {
  const [expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set([crawlPath[0]?.url]))

  // Build tree structure
  const buildTree = () => {
    const tree: Map<string, URLDiscovery[]> = new Map()

    crawlPath.forEach((discovery) => {
      const parent = discovery.discoveredFrom
      if (!tree.has(parent)) {
        tree.set(parent, [])
      }
      tree.get(parent)!.push(discovery)
    })

    return tree
  }

  const tree = buildTree()

  const toggleExpand = (url: string) => {
    const newExpanded = new Set(expandedUrls)
    if (newExpanded.has(url)) {
      newExpanded.delete(url)
    } else {
      newExpanded.add(url)
    }
    setExpandedUrls(newExpanded)
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "html_link":
        return <LinkIcon className="h-3 w-3" />
      case "meta_tag":
        return <FileCode className="h-3 w-3" />
      case "redirect":
        return <ExternalLink className="h-3 w-3" />
      default:
        return <Hash className="h-3 w-3" />
    }
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case "html_link":
        return "bg-blue-500/10 text-blue-500"
      case "meta_tag":
        return "bg-purple-500/10 text-purple-500"
      case "redirect":
        return "bg-orange-500/10 text-orange-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return "text-green-500"
    if (statusCode >= 300 && statusCode < 400) return "text-yellow-500"
    if (statusCode >= 400) return "text-red-500"
    return "text-gray-500"
  }

  const renderNode = (discovery: URLDiscovery, depth = 0) => {
    const page = pages.find((p) => p.url === discovery.url)
    const children = tree.get(discovery.url) || []
    const hasChildren = children.length > 0
    const isExpanded = expandedUrls.has(discovery.url)

    return (
      <div key={discovery.url} className="space-y-1">
        <div
          className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
          style={{ marginLeft: `${depth * 20}px` }}
          onClick={() => hasChildren && toggleExpand(discovery.url)}
        >
          {hasChildren && (
            <ChevronRight
              className={`h-4 w-4 mt-1 transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`}
            />
          )}
          {!hasChildren && <div className="w-4" />}

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`${getMethodColor(discovery.discoveryMethod)} flex items-center gap-1`}
              >
                {getMethodIcon(discovery.discoveryMethod)}
                <span className="text-xs">{discovery.discoveryMethod.replace("_", " ")}</span>
              </Badge>

              {page && (
                <span className={`text-xs font-mono ${getStatusColor(page.statusCode)}`}>{page.statusCode}</span>
              )}

              <span className="text-xs text-muted-foreground">depth: {discovery.depth}</span>
            </div>

            <div className="space-y-0.5">
              {discovery.linkText !== "Starting URL" && discovery.linkText !== "(meta tag)" && (
                <div className="text-sm text-foreground font-medium">"{discovery.linkText}"</div>
              )}
              <div className="text-xs text-muted-foreground font-mono truncate group-hover:text-foreground transition-colors">
                {discovery.url}
              </div>
              {page && page.title && page.title !== "Untitled" && (
                <div className="text-xs text-muted-foreground italic">{page.title}</div>
              )}
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">{children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  if (crawlPath.length === 0) {
    return null
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Crawl Path</h3>
          <p className="text-sm text-muted-foreground">
            Visual representation of how pages were discovered during the crawl
          </p>
        </div>

        <div className="space-y-1 max-h-[600px] overflow-y-auto">{renderNode(crawlPath[0])}</div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500/10" />
            <span>HTML Link</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-500/10" />
            <span>Meta Tag</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500/10" />
            <span>Redirect</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
