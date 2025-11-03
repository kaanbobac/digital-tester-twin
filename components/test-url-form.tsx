"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowRight } from "lucide-react"

export function TestUrlForm() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url) return

    setIsLoading(true)

    // TODO: Implement actual crawling logic
    setTimeout(() => {
      setIsLoading(false)
      // Navigate to results page
      window.location.href = `/test?url=${encodeURIComponent(url)}`
    }, 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
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
      <p className="text-sm text-muted-foreground mt-3 text-center">
        No signup required. Test any public website instantly.
      </p>
    </form>
  )
}
