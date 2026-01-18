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
            <a onClick={() => scrollTo("pricing")} className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
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
                  <DropdownMenuItem onClick={() => setLocation("/credits")}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Credits
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

      {/* Hero Section */}
      <main role="main">
        <section className="pt-24 pb-12 md:pt-32 md:pb-20 px-4 relative overflow-hidden" aria-labelledby="hero-heading">
          <div className="container mx-auto text-center relative z-10">
            <h1 id="hero-heading" className="text-3xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight">
              Private AI Chat That Keeps Your Data <span className="gradient-text">on Your Device</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
              Chofesh is a privacy-first AI chat platform built for people who want control. Access 25+ models, execute code in 60+ languages, bring your own API keys, and use powerful tools without compromising your data.
            </p>
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
                    <FeatureCard title="25+ AI Models" description="Access GPT-4, Claude, Llama, Gemini, and more through a single unified API." icon={<Layers />} />
                    <FeatureCard title="Smart Routing" description="Auto-selects from Groq, Cerebras, OpenRouter, and more for the best model per task." icon={<Sparkles />} />
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
                <AccordionTrigger>Privacy & Security</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FeatureCard title="Local Storage" description="Your conversations are encrypted and stored on your device. We never see them." icon={<Lock />} />
                    <FeatureCard title="Bring Your Keys (BYOK)" description="Use your own API keys for unlimited access. Pay only for what you use." icon={<Key />} />
                    <FeatureCard title="Advanced Security" description="Enterprise-grade prompt injection protection. Detects and blocks malicious prompts." icon={<ShieldCheck />} />
                    <FeatureCard title="Local Models (Ollama)" description="Run AI completely offline with Ollama. Maximum privacy - your data never leaves your device." icon={<Server />} />
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
                  We built Chofesh with a simple principle: your conversations belong to you. We can't read your chats because they never leave your browser - that's how it should be.
                </p>
                <div className="space-y-4">
                  <PrivacyItem icon={<Lock />} title="Encrypted on Your Device" text="AES-256 encryption keeps your data safe, even from us" />
                  <PrivacyItem icon={<Globe />} title="Works Everywhere" text="Access your encrypted conversations from any browser" />
                  <PrivacyItem icon={<Shield />} title="You're in Control" text="Delete your data anytime - it's stored locally" />
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
        <section id="pricing" className="py-12 md:py-20 px-4" aria-labelledby="pricing-heading">
          <div className="container mx-auto">
            <h2 id="pricing-heading" className="text-3xl md:text-4xl font-bold text-center mb-4">
              Simple, <span className="gradient-text">Pay-As-You-Go</span> Pricing
            </h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              30 free credits daily. Buy more when you need them. Credits never expire.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5 max-w-6xl mx-auto">
              <CreditPackCard title="Free Daily" credits="30" price="$0" description="Refreshes every 24 hours" features={["30 credits/day", "All AI models", "Image generation"]} buttonText="Start Free" buttonVariant="outline" href="/chat" />
              <CreditPackCard title="Starter" credits="300" price="$5" description="$1.67 per 100 credits" features={["One-time purchase", "Credits never expire"]} buttonText="Buy Now" href="/credits" />
              <CreditPackCard title="Standard" credits="1,000" price="$12" description="$1.20 per 100 credits" features={["One-time purchase", "Credits never expire"]} buttonText="Buy Now" highlighted href="/credits" />
              <CreditPackCard title="Pro" credits="3,500" price="$35" description="$1.00 per 100 credits" features={["One-time purchase", "Credits never expire"]} buttonText="Buy Now" href="/credits" />
              <CreditPackCard title="Power" credits="12,000" price="$99" description="$0.83 per 100 credits" features={["One-time purchase", "Credits never expire"]} buttonText="Buy Now" href="/credits" />
            </div>
            <div className="text-center mt-8">
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
                <li><a onClick={() => scrollTo("pricing")} className="cursor-pointer hover:text-foreground transition-colors">Pricing</a></li>
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

function CreditPackCard({ title, credits, price, description, features, buttonText, buttonVariant, highlighted, href }: { title: string; credits: string; price: string; description: string; features: string[]; buttonText: string; buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined; highlighted?: boolean; href?: string }) {
  return (
    <div className={`p-4 rounded-xl border ${highlighted ? "border-primary shadow-lg shadow-primary/10" : "border-border"}`}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="mb-2">
        <span className="text-2xl font-bold text-primary">{price}</span>
      </div>
      <div className="mb-3">
        <span className="text-xl font-semibold">{credits}</span>
        <span className="text-muted-foreground text-sm"> credits</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <ul className="space-y-2 text-sm mb-4">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            {feature}
          </li>
        ))}
      </ul>
      {href ? (
        <Link href={href}>
          <Button variant={buttonVariant || "default"} className="w-full">{buttonText}</Button>
        </Link>
      ) : (
        <Button variant={buttonVariant || "default"} className="w-full">{buttonText}</Button>
      )}
    </div>
  );
}
