import { TestUrlForm } from "@/components/test-url-form"
import { Search, Bug, Play, MousePointer } from "lucide-react"

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
            Watch as our AI interacts with your website - clicking buttons, filling forms, and navigating pages. Get
            comprehensive visual reports with screenshots of every action.
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
              <Play className="size-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Visual Testing</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Watch the tool interact with your site in real-time with step-by-step screenshots
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <MousePointer className="size-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Interactive Actions</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Automatically clicks buttons, fills forms, and tests user flows
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
              <Search className="size-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Deep Crawl Mode</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Alternative mode that crawls up to 20 pages and analyzes site structure
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
                  Paste your website URL and choose between Visual Testing or Deep Crawl mode
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Watch the Test Run</h3>
                <p className="text-muted-foreground leading-relaxed">
                  See every action in real-time as the tool navigates, clicks buttons, fills forms, and captures
                  screenshots of each step
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
