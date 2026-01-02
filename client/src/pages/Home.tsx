import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/chofesh-logo.png" alt="Chofesh" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold gradient-text">Chofesh</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
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
                  <Button variant="ghost" size="sm">
                    Chat
                  </Button>
                </Link>
                <Link href="/image">
                  <Button variant="ghost" size="sm">
                    Images
                  </Button>
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm">
                      Admin
                    </Button>
                  </Link>
                )}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{user?.name || "User"}</span>
                </div>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button>Get Started</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Privacy-First AI Platform
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            AI Without <span className="gradient-text">Limits</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Experience creative freedom with uncensored AI. Your conversations stay on your device,
            encrypted and private. No corporate surveillance.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/chat">
                <Button size="lg" className="gap-2">
                  Start Chatting
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="gap-2">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            )}
            <a href="#features">
              <Button size="lg" variant="outline" className="gap-2">
                See Features
              </Button>
            </a>
          </div>
          
          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
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
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything You Need for <span className="gradient-text">AI Freedom</span>
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Powerful features designed with privacy and creative freedom in mind.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Uncensored Chat"
              description="Have real conversations without arbitrary content restrictions. Create, explore, and discuss freely."
              badge="Popular"
            />
            <FeatureCard
              icon={<Image className="w-6 h-6" />}
              title="Image Generation"
              description="Generate stunning images with fewer restrictions. Your creativity, your rules."
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
              icon={<FileText className="w-6 h-6" />}
              title="Document Chat"
              description="Upload PDFs and documents. Ask questions and get intelligent answers."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Usage Dashboard"
              description="Track your usage and costs in real-time. Stay in control of your AI spending."
              badge="New"
            />
            <FeatureCard
              icon={<Lock className="w-6 h-6" />}
              title="Local Storage"
              description="Your conversations are encrypted and stored on your device. We never see them."
            />
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why <span className="gradient-text">Chofesh</span>?
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            See how we compare to other AI platforms.
          </p>
          
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold gradient-text">Chofesh</th>
                  <th className="text-center py-4 px-4 font-semibold text-muted-foreground">ChatGPT</th>
                  <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Others</th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow feature="Local conversation storage" chofesh={true} chatgpt={false} others={false} />
                <ComparisonRow feature="Fewer content restrictions" chofesh={true} chatgpt={false} others="Varies" />
                <ComparisonRow feature="Bring your own API keys" chofesh={true} chatgpt={false} others="Varies" />
                <ComparisonRow feature="Document chat (RAG)" chofesh={true} chatgpt={true} others="Varies" />
                <ComparisonRow feature="Usage tracking" chofesh={true} chatgpt={false} others="Varies" />
                <ComparisonRow feature="Image generation" chofesh={true} chatgpt={true} others="Varies" />
                <ComparisonRow feature="Free tier available" chofesh={true} chatgpt={true} others="Varies" />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How Privacy Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Your Data <span className="gradient-text">Stays Yours</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                We built Chofesh with a simple principle: your conversations belong to you.
                Unlike other platforms, we can't read your chats because they never leave your browser.
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
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-8 flex items-center justify-center">
                <div className="w-full h-full rounded-xl bg-card border border-border p-6 space-y-4">
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
      <section id="pricing" className="py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-4">
            Start free, upgrade when you need more. <span className="text-primary font-medium">8% cheaper than Venice.ai</span>
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Save 20% with annual billing
          </p>
          
          <div className="grid md:grid-cols-5 gap-5 max-w-7xl mx-auto">
            <PricingCard
              title="Free"
              price="$0"
              description="Get started with powerful free models"
              features={[
                "25 queries per day",
                "Llama 3.1 & DeepSeek R1",
                "5 image generations/day",
                "Local encrypted storage",
              ]}
              buttonText="Get Started"
              buttonVariant="outline"
              isAuthenticated={isAuthenticated}
            />
            <PricingCard
              title="Starter"
              price="$4.99"
              period="/month"
              description="Perfect for casual users"
              tier="starter"
              features={[
                "100 queries per day",
                "+ Grok 3 Fast (Aug 2025)",
                "20 image generations/day",
                "Web search & voice",
              ]}
              buttonText="Subscribe"
              buttonVariant="outline"
              isAuthenticated={isAuthenticated}
            />
            <PricingCard
              title="Pro"
              price="$14.99"
              period="/month"
              description="For power users & creators"
              tier="pro"
              features={[
                "500 queries per day",
                "All models incl. GPT-4o",
                "100 image generations/day",
                "Document chat & AI personas",
              ]}
              buttonText="Subscribe"
              buttonVariant="default"
              highlighted
              isAuthenticated={isAuthenticated}
            />
            <PricingCard
              title="Unlimited"
              price="$27.99"
              period="/month"
              description="No limits, full freedom"
              tier="unlimited"
              features={[
                "Unlimited queries",
                "All models & features",
                "Unlimited images",
                "Priority support",
              ]}
              buttonText="Subscribe"
              buttonVariant="outline"
              isAuthenticated={isAuthenticated}
            />
            <PricingCard
              title="BYOK"
              price="$0"
              description="Use your own API keys"
              features={[
                "Unlimited everything",
                "Your OpenAI/Anthropic keys",
                "Pay only API costs",
                "Full model access",
              ]}
              buttonText="Add API Keys"
              buttonVariant="outline"
              isAuthenticated={isAuthenticated}
              isByok={true}
            />
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
            <a href={getLoginUrl()}>
              <Button size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/chofesh-logo.png" alt="Chofesh" className="w-8 h-8 object-contain" />
                <span className="text-xl font-bold">Chofesh</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI without limits. Privacy without compromise.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/chat" className="hover:text-foreground transition-colors">Chat</Link></li>
                <li><Link href="/image" className="hover:text-foreground transition-colors">Image Generation</Link></li>
                <li><a href="/#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
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
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors relative">
      {badge && (
        <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
          {badge}
        </span>
      )}
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
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
        <h4 className="font-medium">{title}</h4>
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
      window.location.href = getLoginUrl();
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
      className={`p-6 rounded-xl border ${
        highlighted
          ? "bg-primary/5 border-primary"
          : "bg-card border-border"
      } relative`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
          Most Popular
        </span>
      )}
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <div className="mb-2">
        <span className="text-4xl font-bold">{price}</span>
        {period && <span className="text-muted-foreground">{period}</span>}
      </div>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>{feature}</span>
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
