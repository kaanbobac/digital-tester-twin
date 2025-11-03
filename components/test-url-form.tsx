"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowRight, Eye, Search } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function TestUrlForm() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [testMode, setTestMode] = useState<"visual" | "crawl">("visual")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url) return

    setIsLoading(true)

    setTimeout(() => {
      setIsLoading(false)
      if (testMode === "visual") {
        window.location.href = `/visual-test?url=${encodeURIComponent(url)}`
      } else {
        window.location.href = `/test?url=${encodeURIComponent(url)}`
      }
    }, 500)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-4">
      <Tabs value={testMode} onValueChange={(v) => setTestMode(v as "visual" | "crawl")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visual" className="gap-2">
            <Eye className="size-4" />
            Visual Testing
          </TabsTrigger>
          <TabsTrigger value="crawl" className="gap-2">
            <Search className="size-4" />
            Deep Crawl
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 h-12 text-base"
          required
        />
        <Button type="submit" size="lg" disabled={isLoading} className="h-12 px-8">
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Testing...
            </>
          ) : (
            <>
              Start Test
              <ArrowRight className="size-4 ml-2" />
            </>
          )}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground text-center">
        {testMode === "visual"
          ? "Watch the tool interact with your site in real-time - clicking buttons, filling forms, and capturing screenshots"
          : "Deep crawl up to 20 pages, analyze links, and detect bugs and UX issues"}
      </p>
    </form>
  )
}
