import { TestUrlForm } from "@/components/test-url-form"
import { Search, Bug, Eye, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <Bug className="size-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">SiteAuditor</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Automated Website Testing
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
            Test your website like a real user
          </h1>
          <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
            Automatically discover bugs, UX issues, and broken flows across your entire website. Get comprehensive
            reports in minutes, not hours.
          </p>

          {/* URL Input Form */}
          <div className="pt-8">
            <TestUrlForm />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-20 border-t border-border">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Search className="size-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Crawling</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Automatically discovers all pages and user flows on your website
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Bug className="size-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Bug Detection</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Identifies broken links, console errors, and functionality issues
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Eye className="size-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Visual Analysis</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Captures screenshots and analyzes UI/UX problems automatically
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="size-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Reports</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Get detailed reports with actionable insights in minutes
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-20 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Enter Your URL</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Simply paste your website URL and our crawler will start exploring as a guest user
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Automated Testing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our AI navigates through your site, testing forms, links, and user flows while capturing screenshots
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Get Your Report</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Review comprehensive findings with screenshots, severity ratings, and recommendations
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-sm text-muted-foreground">Built with Next.js and AI-powered testing</p>
        </div>
      </footer>
    </div>
  )
}
