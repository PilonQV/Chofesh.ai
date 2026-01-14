import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
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
  Github,
  Layers,
  Wrench,
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
            <a href="#features" className="text-sm text-primary hover:text-primary/80 transition-colors font-semibold">Features</a>
            <a href="#pricing" className="text-sm text-primary hover:text-primary/80 transition-colors font-semibold">Pricing</a>
            <Link href="/privacy" className="text-sm text-primary hover:text-primary/80 transition-colors font-semibold">Privacy Policy</Link>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Install App Button */}
            {isInstallable && !isInstalled && (
              <Button
                variant="outline"
                size="sm"
                onClick={promptInstall}
                className="hidden sm:flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Install App
              </Button>
            )}
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full text-primary hover:bg-accent hover:text-primary"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated ? (
              <>
                <Link href="/chat">
                  <Button variant="ghost" size="sm" className="text-primary font-semibold hover:bg-accent hover:text-primary">
                    Chat
                  </Button>
                </Link>
                <Link href="/image">
                  <Button variant="ghost" size="sm" className="text-primary font-semibold hover:bg-accent hover:text-primary">
                    Images
                  </Button>
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="text-primary font-semibold hover:bg-accent hover:text-primary">
                      Admin
                    </Button>
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <span className="text-sm font-medium hidden sm:block">{user?.name || "User"}</span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user?.name || "User"}</p>
                        <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLocation("/chat")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/gallery")}>
                      <Image className="mr-2 h-4 w-4" />
                      My Gallery
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/usage")}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Usage
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open("/api/stripe/portal", "_self")}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Billing
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={async () => {
                        await logout();
                        window.location.href = "/";
                      }}
                      className="text-red-500 focus:text-red-500"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/login">
                <Button>Get Started</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main role="main">
      <section className="pt-24 pb-12 md:pt-32 md:pb-20 px-4 relative overflow-hidden" aria-labelledby="hero-heading">
        {/* Aurora background gradient effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary/30 via-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-cyan-500/20 via-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-purple-500/10 via-primary/15 to-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-primary text-sm font-medium mb-6 border border-primary/20">
            <Shield className="w-4 h-4" />
            Privacy-First AI Platform
          </div>
          
          <h1 id="hero-heading" className="text-3xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight">
            Private AI Chat That Keeps Your Data <span className="gradient-text">on Your Device</span>
          </h1>
          
          <div className="max-w-2xl mx-auto mb-6 md:mb-8 space-y-6 md:space-y-8">
            {/* Private AI chat section */}
            <div className="text-left">
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">Private AI chat that keeps your data on your device.</h3>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Chofesh is a privacy-first AI chat platform built for people who want control. Your chats are stored locally and encrypted on your device (AES-256), so your conversation history isn't sitting on our servers by default.
              </p>
            </div>

            {/* Powerful models section */}
            <div className="text-left">
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">Use powerful models—without lock-in.</h3>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-3">
                Access 25+ models (including DeepSeek R1, Llama 405B, GPT-OSS 120B, and Kimi K2). Use smart routing to automatically pick the best model per task, or bring your own API keys (BYOK) for maximum control.
              </p>
            </div>

            {/* Built for real work section */}
            <div className="text-left">
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">Built for real work, not just chatting.</h3>
              <ul className="space-y-2 text-base md:text-lg text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>AI Research Mode (with live code execution)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Web search with summaries</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Image generation + vision analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Code workspace + document analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Developer SDK with 98% test coverage</span>
                </li>
              </ul>
            </div>

            {/* Privacy-first section */}
            <div className="text-left">
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">Privacy-first by design.</h3>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Zero server-side retention for your stored conversation history, and encrypted local storage so your data stays yours.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/chat">
                <Button size="lg" className="gap-2">
                  Start Chat
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  Start Chat
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
            <a href="#features">
              <Button size="lg" variant="outline" className="gap-2">
                See Features
              </Button>
            </a>
          </div>
          
          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-8 md:mt-12 text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>No data collection</span>
            </div>
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              <span>BYOK supported</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span>25+ free AI models</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-20 px-4" aria-labelledby="features-heading">
        <div className="container mx-auto">
          <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything You Need for <span className="gradient-text">AI Freedom</span>
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8 md:mb-12">
            Powerful features designed with privacy and creative freedom in mind.
          </p>
          
          {/* What's New Section - Highlighted */}
          <div className="mb-8 md:mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">What's New</h3>
              <Badge variant="secondary" className="bg-primary/20 text-primary">Latest Features</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
              <FeatureCard
                icon={<Braces className="w-6 h-6" />}
                title="Developer SDK"
                description="Build autonomous agents with our Python SDK. 98% test coverage, 167+ tests, and full GitHub integration."
                badge="New"
                highlighted
              />
              <FeatureCard
                icon={<Code2 className="w-6 h-6" />}
                title="AI Research Mode"
                description="Advanced AI agent with web search and live code execution. Run Python, JavaScript, and 60+ languages—100% free."
                badge="New"
                highlighted
              />
              <FeatureCard
                icon={<ShieldCheck className="w-6 h-6" />}
                title="Advanced Security"
                description="Enterprise-grade prompt injection protection. Detects and blocks malicious prompts and jailbreak attempts."
                badge="New"
                highlighted
              />
              <FeatureCard
                icon={<Zap className="w-6 h-6" />}
                title="Cerebras AI"
                description="Ultra-fast inference with Cerebras. Llama 3.3 70B responses in under 500ms. The fastest AI on the planet."
                badge="New"
                highlighted
              />
              <FeatureCard
                icon={<Globe className="w-6 h-6" />}
                title="Search with AI"
                description="Perplexity-style web search with AI summaries and inline citations. Get answers with sources."
                badge="New"
                highlighted
              />
              <FeatureCard
                icon={<Server className="w-6 h-6" />}
                title="25+ Free Models"
                description="DeepSeek R1, Llama 405B, GPT-OSS 120B, Kimi K2, Gemma 3, Mistral - all free. No API keys needed."
                badge="Free"
                highlighted
              />
              <FeatureCard
                icon={<BarChart3 className="w-6 h-6" />}
                title="Provider Analytics"
                description="Track AI usage by provider, see cost savings from free tiers, and monitor popular models."
                badge="New"
                highlighted
              />
              <FeatureCard
                icon={<Wrench className="w-6 h-6" />}
                title="Smart Tools"
                description="YouTube summarizer, URL analyzer, math calculator, unit converter, regex tester, and more."
                badge="New"
                highlighted
              />
              <FeatureCard
                icon={<FolderTree className="w-6 h-6" />}
                title="Conversation Folders"
                description="Organize your chats by project or topic. Keep your AI conversations structured and easy to find."
                badge="New"
                highlighted
              />
            </div>
          </div>

          {/* All Features */}
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-muted-foreground">All Features</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Uncensored Chat"
              description="Have real conversations without arbitrary content restrictions (within legal parameters). Auto-fallback to unrestricted models when needed."
              badge="Popular"
            />
            <FeatureCard
              icon={<Eye className="w-6 h-6" />}
              title="Vision Analysis"
              description="Upload images and let AI analyze, describe, and discuss them. Extract text, identify objects, and more."
            />
            <FeatureCard
              icon={<Image className="w-6 h-6" />}
              title="Image Generation"
              description="Generate stunning images with fewer restrictions. Your creativity, your rules."
            />
            <FeatureCard
              icon={<Search className="w-6 h-6" />}
              title="Deep Research"
              description="Perplexity-style search with AI summaries and inline citations. Multi-step research from multiple sources."
              badge="Enhanced"
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Privacy First"
              description="Your conversations are encrypted locally. We can't read them, even if we wanted to."
            />
            <FeatureCard
              icon={<Key className="w-6 h-6" />}
              title="Bring Your Keys"
              description="Use your own API keys for unlimited access. Pay only for what you use."
              badge="BYOK"
            />
            <FeatureCard
              icon={<Database className="w-6 h-6" />}
              title="Knowledge Base"
              description="Upload PDFs and documents. Chat with your data using semantic search and source citations."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Usage Dashboard"
              description="Track your usage and costs in real-time. Stay in control of your AI spending."
            />
            <FeatureCard
              icon={<Lock className="w-6 h-6" />}
              title="Local Storage"
              description="Your conversations are encrypted and stored on your device. We never see them."
            />
            <FeatureCard
              icon={<Brain className="w-6 h-6" />}
              title="Memory System"
              description="AI remembers your preferences, facts, and instructions across conversations. Personalized experience."
            />
            <FeatureCard
              icon={<Lightbulb className="w-6 h-6" />}
              title="Thinking Mode"
              description="See the AI's reasoning process. Understand how it arrives at answers with transparent thinking."
            />
            <FeatureCard
              icon={<FileCode className="w-6 h-6" />}
              title="Artifacts Panel"
              description="Create and iterate on documents, code, and diagrams in a dedicated workspace with version history."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="AI Personas"
              description="20+ expert personas: Senior Developer, Creative Writer, Research Assistant, and more. Specialized AI for every task."
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="Smart Routing"
              description="Auto-selects from Groq, Cerebras, OpenRouter, and more. 20+ free models including DeepSeek R1, Llama 405B, Kimi K2."
              badge="Enhanced"
            />
            <FeatureCard
              icon={<Code2 className="w-6 h-6" />}
              title="Code Workspace"
              description="Full-featured code editor with AI assistance. Write, refactor, and debug code with intelligent suggestions."
            />
            <FeatureCard
              icon={<Workflow className="w-6 h-6" />}
              title="AI Workflows"
              description="Visual workflow builder for automation. Chain AI tasks together with drag-and-drop simplicity."
            />
            <FeatureCard
              icon={<Server className="w-6 h-6" />}
              title="Local Models"
              description="Run AI completely offline with Ollama. Maximum privacy - your data never leaves your device."
              badge="Privacy"
            />
            <FeatureCard
              icon={<Link2 className="w-6 h-6" />}
              title="Ask Dia Links"
              description="Clickable terms in AI responses for instant follow-up questions. Learn more about any concept."
            />
          </div>
        </div>
      </section>

      {/* Why Chofesh Section */}
      <section className="py-12 md:py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why <span className="gradient-text">Chofesh</span>?
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8 md:mb-12">
            Built from the ground up for privacy, freedom, and powerful AI capabilities.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Privacy First */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">True Privacy</h3>
              <p className="text-sm text-muted-foreground mb-4">Your conversations stay on your device, encrypted with AES-256. We can't read them even if we wanted to.</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Local storage only</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> End-to-end encryption</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> No data collection</li>
              </ul>
            </div>

            {/* Creative Freedom */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Creative Freedom</h3>
              <p className="text-sm text-muted-foreground mb-4">Express yourself without arbitrary restrictions. Uncensored AI for adults who want genuine conversations.</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-500" /> Uncensored chat mode</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-500" /> Adult content (18+)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-500" /> No topic restrictions</li>
              </ul>
            </div>

            {/* Powerful Tools */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                <Wrench className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Powerful Tools</h3>
              <p className="text-sm text-muted-foreground mb-4">Everything you need in one place. From YouTube summarizer to code workspace, we've got you covered.</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> 20+ productivity tools</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Developer utilities</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Document analysis</li>
              </ul>
            </div>

            {/* Multiple Models */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Model Selection</h3>
              <p className="text-sm text-muted-foreground mb-4">Access multiple AI models and let our smart routing pick the best one for each task automatically.</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500" /> Auto model selection</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500" /> Free & premium tiers</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500" /> BYOK supported</li>
              </ul>
            </div>

            {/* Agent Mode */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-cyan-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Agent Mode</h3>
              <p className="text-sm text-muted-foreground mb-4">AI that takes action. Generate images, search the web, create documents - all from natural conversation.</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-500" /> Auto image generation</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-500" /> Web search integration</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-500" /> Document creation</li>
              </ul>
            </div>

            {/* Fair Pricing */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20">
              <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Fair Pricing</h3>
              <p className="text-sm text-muted-foreground mb-4">No subscriptions required. Get 30 free credits daily, buy more when you need them. Credits never expire.</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-pink-500" /> 30 free credits/day</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-pink-500" /> Pay-as-you-go</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-pink-500" /> No expiration</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How Privacy Works */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Your Data <span className="gradient-text">Stays Yours</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                We built Chofesh with a simple principle: your conversations belong to you.
                We can't read your chats because they never leave your browser - that's how it should be.
              </p>
              <div className="space-y-4">
                <PrivacyItem
                  icon={<Lock className="w-5 h-5" />}
                  title="Encrypted on Your Device"
                  text="AES-256 encryption keeps your data safe, even from us"
                />
                <PrivacyItem
                  icon={<Globe className="w-5 h-5" />}
                  title="Works Everywhere"
                  text="Access your encrypted conversations from any browser"
                />
                <PrivacyItem
                  icon={<Shield className="w-5 h-5" />}
                  title="You're in Control"
                  text="Delete your data anytime - it's stored locally"
                />
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
                      <div className="font-medium">Your Device Only</div>
                      <div className="text-sm text-muted-foreground">Nothing stored on our servers</div>
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Conversations encrypted locally</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Images stored on your device</span>
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

      {/* Pricing Section */}
      <section id="pricing" className="py-12 md:py-20 px-4 bg-card/50" aria-labelledby="pricing-heading">
        <div className="container mx-auto">
          <h2 id="pricing-heading" className="text-3xl md:text-4xl font-bold text-center mb-4">
            Simple, <span className="gradient-text">Pay-As-You-Go</span> Pricing
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-4">
            30 free credits daily. Buy more when you need them.
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Credits never expire • No subscriptions required
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-5 max-w-7xl mx-auto">
            <CreditPackCard
              title="Free Daily"
              credits="30"
              price="$0"
              description="Refreshes every 24 hours"
              features={[
                "30 credits/day",
                "All AI models",
                "Image generation",
                "Never expires",
              ]}
              buttonText="Start Free"
              buttonVariant="outline"
              isAuthenticated={isAuthenticated}
            />
            <CreditPackCard
              title="Starter Pack"
              credits="300"
              price="$5"
              pricePerCredit="$1.67/100cr"
              description="Perfect for trying out"
              features={[
                "300 credits",
                "All AI models",
                "Never expires",
                "One-time purchase",
              ]}
              buttonText="Buy Credits"
              buttonVariant="outline"
              packId="starter"
              isAuthenticated={isAuthenticated}
            />
            <CreditPackCard
              title="Standard Pack"
              credits="1,000"
              price="$12"
              pricePerCredit="$1.20/100cr"
              description="Best for regular users"
              badge="Best Value"
              features={[
                "1,000 credits",
                "Save 28%",
                "Never expires",
                "One-time purchase",
              ]}
              buttonText="Buy Credits"
              buttonVariant="default"
              highlighted
              packId="standard"
              isAuthenticated={isAuthenticated}
            />
            <CreditPackCard
              title="Pro Pack"
              credits="3,500"
              price="$35"
              pricePerCredit="$1.00/100cr"
              description="For power users"
              features={[
                "3,500 credits",
                "Save 40%",
                "Never expires",
                "One-time purchase",
              ]}
              buttonText="Buy Credits"
              buttonVariant="outline"
              packId="pro"
              isAuthenticated={isAuthenticated}
            />
            <CreditPackCard
              title="Power Pack"
              credits="12,000"
              price="$99"
              pricePerCredit="$0.83/100cr"
              description="Maximum value"
              badge="Most Popular"
              features={[
                "12,000 credits",
                "Save 50%",
                "Never expires",
                "One-time purchase",
              ]}
              buttonText="Buy Credits"
              buttonVariant="outline"
              packId="power"
              isAuthenticated={isAuthenticated}
            />
            <CreditPackCard
              title="BYOK"
              credits="∞"
              price="$0"
              description="Use your own API keys"
              features={[
                "Unlimited usage",
                "Your API keys",
                "Pay only costs",
                "Full access",
              ]}
              buttonText="Add API Keys"
              buttonVariant="outline"
              isAuthenticated={isAuthenticated}
              isByok={true}
            />
          </div>
          
          {/* Credit costs info */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">How credits are used:</p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <span className="px-3 py-1 bg-card rounded-full border">Free models: 1 credit</span>
              <span className="px-3 py-1 bg-card rounded-full border">Standard: 2 credits</span>
              <span className="px-3 py-1 bg-card rounded-full border">Premium: 8 credits</span>
              <span className="px-3 py-1 bg-card rounded-full border">Images: 3 credits/image</span>
            </div>
            <Link href="/credits" className="inline-block mt-4 text-sm text-primary hover:underline">
              View full pricing details →
            </Link>
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
            Join thousands of users who've chosen privacy-first AI.
            Start free, no credit card required.
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
      <footer className="py-12 px-4 border-t border-border" role="contentinfo">
        <div className="container mx-auto">
          <h3 className="sr-only">Footer Navigation</h3>
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/chofesh-logo-48.webp" alt="Chofesh" className="w-8 h-8 object-contain" width="32" height="32" loading="eager" />
                <span className="text-xl font-bold">Chofesh</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI without limits. Privacy without compromise.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-base">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/chat" className="hover:text-foreground transition-colors">Chat</Link></li>
                <li><Link href="/image" className="hover:text-foreground transition-colors">Image Generation</Link></li>
                <li><a href="/#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-base">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-base">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/#features" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="mailto:support@chofesh.ai" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Chofesh. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Made for creators who value freedom.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  badge,
  highlighted,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  highlighted?: boolean;
}) {
  return (
    <div className={`group p-4 md:p-6 rounded-xl border transition-all duration-300 relative cursor-pointer backdrop-blur-sm ${
      highlighted 
        ? 'bg-gradient-to-br from-primary/15 to-primary/5 border-primary/40 hover:border-primary shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1' 
        : 'bg-card/50 border-border/50 hover:border-primary/50 hover:bg-card/70 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5'
    }`}>
      {badge && (
        <span className={`absolute top-3 right-3 md:top-4 md:right-4 px-2 py-0.5 md:py-1 text-xs font-medium rounded-full transition-transform duration-300 group-hover:scale-110 ${
          highlighted ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
        }`}>
          {badge}
        </span>
      )}
      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-3 md:mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
        highlighted ? 'bg-primary text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/30' : 'bg-primary/10 text-primary group-hover:bg-primary/20'
      }`}>
        {icon}
      </div>
      <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2 transition-colors duration-300 group-hover:text-primary">{title}</h3>
      <p className="text-muted-foreground text-xs md:text-sm transition-colors duration-300 group-hover:text-muted-foreground/80">{description}</p>
    </div>
  );
}

function ComparisonRow({
  feature,
  chofesh,
  chatgpt,
  others,
}: {
  feature: string;
  chofesh: boolean | string;
  chatgpt: boolean | string;
  others: boolean | string;
}) {
  const renderValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="w-5 h-5 text-green-500 mx-auto" />
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    }
    return <span className="text-muted-foreground text-sm">{value}</span>;
  };

  return (
    <tr className="border-b border-border">
      <td className="py-4 px-4 text-sm">{feature}</td>
      <td className="py-4 px-4 text-center">{renderValue(chofesh)}</td>
      <td className="py-4 px-4 text-center">{renderValue(chatgpt)}</td>
      <td className="py-4 px-4 text-center">{renderValue(others)}</td>
    </tr>
  );
}

function PrivacyItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function PricingCard({
  title,
  price,
  period,
  description,
  features,
  buttonText,
  buttonVariant,
  highlighted,
  tier,
  isAuthenticated,
  isByok,
}: {
  title: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant: "default" | "outline";
  highlighted?: boolean;
  tier?: "starter" | "pro" | "unlimited";
  isAuthenticated?: boolean;
  isByok?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start checkout");
      setIsLoading(false);
    },
  });

  const handleClick = () => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    // If BYOK, go to settings to add API keys
    if (isByok) {
      setLocation("/settings");
      return;
    }

    // If no tier (Free), go to chat
    if (!tier) {
      setLocation("/chat");
      return;
    }

    // Start checkout for paid tiers
    setIsLoading(true);
    createCheckout.mutate({ tier });
  };

  return (
    <div
      className={`p-4 md:p-6 rounded-xl border ${
        highlighted
          ? "bg-primary/5 border-primary"
          : "bg-card border-border"
      } relative`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 md:px-3 py-0.5 md:py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
          Most Popular
        </span>
      )}
      <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">{title}</h3>
      <div className="mb-1 md:mb-2">
        <span className="text-2xl md:text-4xl font-bold">{price}</span>
        {period && <span className="text-muted-foreground text-xs md:text-base">{period}</span>}
      </div>
      <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-6 line-clamp-2">{description}</p>
      <ul className="space-y-1.5 md:space-y-3 mb-4 md:mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <Check className="w-3 h-3 md:w-4 md:h-4 text-green-500 flex-shrink-0" />
            <span className="line-clamp-1">{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        variant={buttonVariant}
        className="w-full"
        disabled={isLoading}
        onClick={handleClick}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          buttonText
        )}
      </Button>
    </div>
  );
}


// CreditPackCard component for credits-based pricing
function CreditPackCard({
  title,
  credits,
  price,
  pricePerCredit,
  description,
  features,
  buttonText,
  buttonVariant,
  highlighted,
  badge,
  packId,
  isAuthenticated,
  isByok,
}: {
  title: string;
  credits: string;
  price: string;
  pricePerCredit?: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant: "default" | "outline";
  highlighted?: boolean;
  badge?: string;
  packId?: string;
  isAuthenticated?: boolean;
  isByok?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  
  const handleClick = () => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    // If BYOK, go to settings to add API keys
    if (isByok) {
      setLocation("/settings");
      return;
    }

    // If no packId (Free), go to chat
    if (!packId) {
      setLocation("/chat");
      return;
    }

    // Go to credits page for purchase
    setLocation("/credits");
  };

  return (
    <div
      className={`p-4 md:p-6 rounded-xl border ${
        highlighted
          ? "bg-primary/5 border-primary"
          : "bg-card border-border"
      } relative`}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 md:px-3 py-0.5 md:py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full whitespace-nowrap">
          {badge}
        </span>
      )}
      <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">{title}</h3>
      <div className="mb-1">
        <span className="text-3xl md:text-4xl font-bold text-primary">{credits}</span>
        <span className="text-muted-foreground text-xs md:text-sm ml-1">credits</span>
      </div>
      <div className="mb-1 md:mb-2">
        <span className="text-xl md:text-2xl font-bold">{price}</span>
        {pricePerCredit && <span className="text-muted-foreground text-xs ml-2">{pricePerCredit}</span>}
      </div>
      <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 line-clamp-2">{description}</p>
      <ul className="space-y-1.5 md:space-y-2 mb-4 md:mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <Check className="w-3 h-3 md:w-4 md:h-4 text-green-500 flex-shrink-0" />
            <span className="line-clamp-1">{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        variant={buttonVariant}
        className="w-full"
        disabled={isLoading}
        onClick={handleClick}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          buttonText
        )}
      </Button>
    </div>
  );
}
