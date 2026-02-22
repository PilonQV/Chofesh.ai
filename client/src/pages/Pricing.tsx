import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Github, Star, GitFork, BookOpen, MessageSquare, Rocket } from "lucide-react";

export default function Pricing() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Helmet>
        <title>Open Source AI Gateway - Free & Self-Hosted | Chofesh</title>
        <meta name="description" content="Chofesh is now 100% open source! Self-host your own AI gateway with 25+ models, code execution, image generation, and complete privacy. MIT License." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Chofesh AI Gateway",
            "applicationCategory": "AI Platform",
            "operatingSystem": "Any",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "license": "https://opensource.org/licenses/MIT"
          })}
        </script>
      </Helmet>
      
      <main className="max-w-4xl mx-auto">
        {/* Open Source Banner */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
            <span className="text-green-500 text-2xl">🎉</span>
            <span className="text-green-500 font-semibold">Now 100% Open Source!</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Free AI Gateway — <span className="gradient-text">Forever</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Chofesh is now open source under the MIT license. Self-host your own AI gateway with 
            25+ models, code execution, image generation, and complete privacy — at zero cost.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="https://github.com/PilonQV/Chofesh.ai" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <Github className="w-5 h-5" />
                View on GitHub
              </Button>
            </a>
            <Link href="/chat">
              <Button variant="outline" size="lg" className="gap-2">
                Try Live Demo
                <Rocket className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Why Open Source */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Why Open Source?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border bg-card/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Transparency</h3>
              <p className="text-sm text-muted-foreground">
                Audit every line of code. No black boxes, no hidden data collection. Your privacy is guaranteed.
              </p>
            </div>
            <div className="p-6 rounded-xl border bg-card/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <GitFork className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Freedom</h3>
              <p className="text-sm text-muted-foreground">
                Fork it, modify it, self-host it. Your AI, your rules. No subscriptions, no limits.
              </p>
            </div>
            <div className="p-6 rounded-xl border bg-card/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Community</h3>
              <p className="text-sm text-muted-foreground">
                Built by developers, for developers. Contribute, improve, and help shape the future of AI.
              </p>
            </div>
          </div>
        </section>

        {/* Self-Hosting */}
        <section className="mb-12 p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border">
          <h2 className="text-2xl font-bold mb-4 text-center">Self-Host in Minutes</h2>
          <p className="text-center text-muted-foreground mb-6">
            Deploy your own instance with Docker. Full control, zero dependencies on external services.
          </p>
          <div className="bg-card rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <code className="text-muted-foreground">
              <span className="text-green-500"># Clone and run</span><br />
              git clone https://github.com/PilonQV/Chofesh.ai<br />
              cd Chofesh.ai<br />
              docker-compose up -d
            </code>
          </div>
          <div className="text-center mt-6">
            <a href="https://github.com/PilonQV/Chofesh.ai#readme" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Full Documentation
              </Button>
            </a>
          </div>
        </section>

        {/* Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">What's Included</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "25+ AI Models (GPT, Claude, Llama, Mistral...)",
              "Code Execution (60+ languages)",
              "Image Generation",
              "Research Mode with Web Search",
              "BYOK (Bring Your Own Keys)",
              "Local Models (Ollama)",
              "Memory System",
              "Custom Characters",
              "Artifacts",
              "Document Processing (RAG)",
              "Developer SDK",
              "Webhooks API",
              "Privacy-First Architecture",
              "MIT License (Commercial Use OK)",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 p-3 rounded-lg bg-card/50">
                <span className="text-green-500">✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center p-8 rounded-2xl bg-card border">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6">
            Star us on GitHub, join the community, or start self-hosting today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="https://github.com/PilonQV/Chofesh.ai" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <Github className="w-5 h-5" />
                Star on GitHub
              </Button>
            </a>
            <a href="https://github.com/PilonQV/Chofesh.ai/discussions" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg">
                Join Discussions
              </Button>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
