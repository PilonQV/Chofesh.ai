import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MessageSquare,
  Image,
  Shield,
  Lock,
  ArrowRight,
  Zap,
  Key,
  FileText,
  BarChart3,
  Check,
  Globe,
  Sun,
  Moon,
  Loader2,
  Settings,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  CreditCard,
  Download,
  Brain,
  Lightbulb,
  FileCode,
  Users,
  Sparkles,
  Eye,
  Search,
  Code2,
  Workflow,
  Server,
  Database,
  ShieldCheck,
  Link2,
  Layers,
  Wrench,
  Webhook,
  Clock,
  Rocket,
  Calculator,
  Youtube,
  Braces,
  GitCompare,
  FolderTree,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background aurora-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass" role="banner" aria-label="Main navigation">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/chofesh-logo-48.webp" alt="Chofesh" className="w-8 h-8 object-contain" width="32" height="32" loading="eager" />
            <span className="text-xl font-bold gradient-text">Chofesh</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <a onClick={() => scrollTo("features")} className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="https://github.com/PilonQV/Chofesh.ai" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </a>
            <Link href="/developers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Developers</Link>
            <a onClick={() => scrollTo("privacy")} className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {user?.name || "Account"}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/chat")}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/gallery")}>
                    <Image className="w-4 h-4 mr-2" />
                    My Gallery
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="outline" className="gap-2">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Open Source Banner */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-green-500/10 to-blue-500/10 border-b border-green-500/20">
        <div className="container mx-auto px-4 py-2 text-center">
          <p className="text-sm">
            🎉 <strong className="text-green-500">Chofesh is now Open Source!</strong> 
            <a href="https://github.com/PilonQV/Chofesh.ai" target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline">
              Star us on GitHub →
            </a>
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <main role="main">
        <section className="pt-32 pb-12 md:pt-40 md:pb-20 px-4 relative overflow-hidden" aria-labelledby="hero-heading">
          <div className="container mx-auto text-center relative z-10">
            <h1 id="hero-heading" className="text-3xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight">
              Your Complete AI Platform With <span className="gradient-text">12+ Powerful Features</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-6">
              Agent Mode for autonomous tasks, Thinking Mode for complex reasoning, Vision Analysis, Code Execution in 60+ languages, Image Generation, Smart Model Routing, BYOK (Bring Your Own Keys), Local Models with Ollama, Memory System, Custom Characters, Artifacts, and more. <span className="text-green-500 font-semibold">Now 100% Open Source!</span> Self-host for free or use our hosted version.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8 max-w-3xl mx-auto">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <Zap className="w-3.5 h-3.5" />
                Agent Mode
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <Brain className="w-3.5 h-3.5" />
                Thinking Mode
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <Eye className="w-3.5 h-3.5" />
                Vision Analysis
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <Code2 className="w-3.5 h-3.5" />
                Code Execution
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <Image className="w-3.5 h-3.5" />
                Image Generation
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <Key className="w-3.5 h-3.5" />
                BYOK
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <Server className="w-3.5 h-3.5" />
                Local Models
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                +5 More
              </Badge>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Link href={isAuthenticated ? "/chat" : "/login"}>
                <Button size="lg" className="gap-2">
                  Start Chatting Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a onClick={() => scrollTo("features")} className="cursor-pointer">
                <Button variant="secondary" size="lg" className="gap-2">
                  Explore Features
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Consolidated Features Section */}
        <section id="features" className="py-12 md:py-20 px-4" aria-labelledby="features-heading">
          <div className="container mx-auto">
            <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-center mb-4">
              Everything You Need for <span className="gradient-text">AI Freedom</span>
            </h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8 md:mb-12">
              Powerful features designed with privacy and creative freedom in mind.
            </p>
            <Accordion type="single" collapsible className="w-full max-w-4xl mx-auto">
              <AccordionItem value="item-1">
                <AccordionTrigger>AI & Models</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FeatureCard title="25+ AI Models" description="Access the latest AI models through a single unified API." icon={<Layers />} />
                    <FeatureCard title="Smart Routing" description="Automatically selects the best model for each task." icon={<Sparkles />} />
                    <FeatureCard title="Natural Conversations" description="Have authentic, helpful conversations with advanced AI assistants." icon={<MessageSquare />} />
                    <FeatureCard title="Vision Analysis" description="Upload images and let AI analyze, describe, and discuss them." icon={<Eye />} />
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Tools & Workflows</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FeatureCard title="Developer SDK" description="Build autonomous agents with our Python SDK. 98% test coverage, 167+ tests, and full GitHub integration." icon={<Braces />} href="/developers" />
                    <FeatureCard title="AI Research Mode" description="Advanced AI agent with web search and live code execution." icon={<Code2 />} />
                    <FeatureCard title="Smart Tools" description="YouTube summarizer, URL analyzer, math calculator, unit converter, and more." icon={<Wrench />} />
                    <FeatureCard title="AI Workflows" description="Visual workflow builder for automation. Chain AI tasks together with drag-and-drop simplicity." icon={<Workflow />} />
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Code Execution & Workspaces</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FeatureCard title="60+ Languages" description="Execute Python, JavaScript, TypeScript, Java, C++, Go, Rust, Ruby, and 50+ more languages directly in chat." icon={<Code2 />} />
                    <FeatureCard title="Workspace Abstraction" description="Flexible execution environments with automatic provider selection - Piston, Docker, or Local." icon={<Server />} />
                    <FeatureCard title="Package Management" description="Install packages on-the-fly with pip, npm, yarn, cargo, go, gem, and composer support." icon={<FolderTree />} />
                    <FeatureCard title="Smart Fallback" description="Automatic failover between providers ensures your code always runs, even under heavy load." icon={<GitCompare />} />
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Automation & Integrations</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FeatureCard title="Webhooks API" description="Receive real-time notifications when AI tasks complete. Integrate with Zapier, Make.com, n8n, and custom apps." icon={<Webhook />} href="/automation" />
                    <FeatureCard title="Scheduled Tasks" description="Automate recurring AI workflows with cron scheduling. Daily reports, weekly summaries, monthly analysis - all hands-free." icon={<Clock />} href="/automation" />
                    <FeatureCard title="Project Builders" description="Create complete deliverables: kids books with illustrations, websites with code, app designs with wireframes, marketing campaigns." icon={<Rocket />} />
                    <FeatureCard title="API Access" description="Full REST API access to 50+ AI models, smart routing, and all platform features. Build your own integrations." icon={<Code2 />} href="/developers" />
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>Privacy & Security</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FeatureCard title="Secure Storage" description="Your conversations are securely stored with industry-standard encryption and access controls." icon={<Lock />} />
                    <FeatureCard title="Bring Your Keys (BYOK)" description="Use your own API keys for unlimited access. Pay only for what you use." icon={<Key />} />
                    <FeatureCard title="Advanced Security" description="Enterprise-grade prompt injection protection. Detects and blocks malicious prompts." icon={<ShieldCheck />} />
                    <FeatureCard title="Local Models (Ollama)" description="Run AI completely offline with Ollama for maximum privacy." icon={<Server />} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Streamlined Privacy Section */}
        <section id="privacy" className="py-12 md:py-20 px-4 bg-card/50">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Your Data <span className="gradient-text">Stays Yours</span>
                </h2>
                <p className="text-muted-foreground mb-6">
                  We built Chofesh with a simple principle: your conversations belong to you. We protect your data with industry-standard encryption and strict access controls.
                </p>
                <div className="space-y-4">
                  <PrivacyItem icon={<Lock />} title="Encrypted Storage" text="Industry-standard encryption protects your conversations" />
                  <PrivacyItem icon={<Globe />} title="Secure Access" text="Access your conversations securely from any device" />
                  <PrivacyItem icon={<Shield />} title="You're in Control" text="Delete your data anytime - you own your conversations" />
                </div>
                <div className="mt-8">
                  <Link href="/privacy">
                    <Button variant="outline" className="gap-2">
                      Learn More About Privacy
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-auto md:aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-4 md:p-8 flex items-center justify-center">
                  <div className="w-full h-full rounded-xl bg-card border border-border p-4 md:p-6 space-y-3 md:space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <div className="font-medium">Securely Protected</div>
                        <div className="text-sm text-muted-foreground">Industry-standard security</div>
                      </div>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Conversations encrypted in transit and at rest</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Secure image storage with S3</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Documents processed privately</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Open Source Section */}
        <section id="pricing" className="py-12 md:py-20 px-4 bg-card/50" aria-labelledby="pricing-heading">
          <div className="container mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-4">
                <span className="text-green-500 text-xl">🎉</span>
                <span className="text-green-500 font-semibold">Now Open Source!</span>
              </div>
              <h2 id="pricing-heading" className="text-3xl md:text-4xl font-bold mb-4">
                Free & <span className="gradient-text">Open Source</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                Chofesh is now 100% open source under the MIT license. Self-host your own instance or use our free hosted version.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="p-6 rounded-xl border bg-card">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-green-500">✓</span> Free Hosted Version
                </h3>
                <ul className="space-y-3 text-sm mb-6">
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 30 free credits daily</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> All 25+ AI models</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Image generation</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Code execution</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> BYOK (Bring Your Own Keys)</li>
                </ul>
                <Link href="/chat">
                  <Button className="w-full">Start Free</Button>
                </Link>
              </div>
              
              <div className="p-6 rounded-xl border border-primary shadow-lg shadow-primary/10 bg-card">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-primary">⭐</span> Self-Host (Free Forever)
                </h3>
                <ul className="space-y-3 text-sm mb-6">
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Unlimited usage</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Full control & privacy</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Your own servers</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> MIT License (commercial OK)</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Community support</li>
                </ul>
                <a href="https://github.com/PilonQV/Chofesh.ai" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full">View on GitHub</Button>
                </a>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground">
                Want to contribute? <a href="https://github.com/PilonQV/Chofesh.ai/discussions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Join the community →</a>
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready for <span className="gradient-text">AI Freedom</span>?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Join thousands of users who've chosen privacy-first AI. Start free, no credit card required.
            </p>
            {isAuthenticated ? (
              <Link href="/chat">
                <Button size="lg" className="gap-2">
                  Go to Chat
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-card/30" role="contentinfo">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a onClick={() => scrollTo("features")} className="cursor-pointer hover:text-foreground transition-colors">Features</a></li>
                <li><a href="https://github.com/PilonQV/Chofesh.ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a></li>
                <li><Link href="/developers" className="hover:text-foreground transition-colors">Developers</Link></li>
                <li><Link href="/compare/chofesh-vs-chatgpt" className="hover:text-foreground transition-colors">Compare</Link></li>
              </ul>
            </div>
            
            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/developers" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/support" className="hover:text-foreground transition-colors">Support</Link></li>
                <li><Link href="/features" className="hover:text-foreground transition-colors">Feature Guide</Link></li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/support" className="hover:text-foreground transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/chofesh-logo-48.webp" alt="Chofesh" className="w-6 h-6 object-contain" width="24" height="24" />
              <span className="font-semibold gradient-text">Chofesh</span>
            </div>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Chofesh. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, href }: { icon: React.ReactNode; title: string; description: string; href?: string }) {
  const content = (
    <div className="group p-4 rounded-xl border transition-all duration-300 hover:border-primary/50 hover:bg-card/70 hover:-translate-y-1">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-1.5 transition-colors duration-300 group-hover:text-primary">{title}</h3>
      <p className="text-muted-foreground text-sm transition-colors duration-300 group-hover:text-muted-foreground/80">{description}</p>
    </div>
  );
  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function PrivacyItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
