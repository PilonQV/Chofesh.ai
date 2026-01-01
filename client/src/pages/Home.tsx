import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  MessageSquare,
  Image,
  Shield,
  Lock,
  Sparkles,
  ArrowRight,
  Zap,
  Eye,
  Database,
} from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text">LibreAI</span>
          </Link>
          
          <div className="flex items-center gap-4">
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
                  <span className="text-sm font-medium">{user?.name || "User"}</span>
                </div>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button>Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Private & Uncensored AI</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text">Unleash Your</span>
            <br />
            <span className="text-foreground">Creative Freedom</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Experience AI without limits. Generate text and images with complete privacy.
            Your conversations stay on your device, encrypted and secure.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link href="/chat">
                  <Button size="lg" className="gap-2 glow">
                    <MessageSquare className="w-5 h-5" />
                    Start Chatting
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/image">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Image className="w-5 h-5" />
                    Generate Images
                  </Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="gap-2 glow">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why Choose <span className="gradient-text">LibreAI</span>?
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Built for privacy-conscious creators who demand both freedom and security.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Lock className="w-6 h-6" />}
              title="Local Encryption"
              description="Your conversations are encrypted and stored locally on your device. We never see or store your chats."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Legal Compliance"
              description="Audit logging captures metadata for legal requirements without compromising your privacy."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Multiple Models"
              description="Choose from various AI models for text and image generation to suit your needs."
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Uncensored Chat"
              description="Have honest conversations without artificial restrictions. Get real answers to real questions."
            />
            <FeatureCard
              icon={<Image className="w-6 h-6" />}
              title="Image Generation"
              description="Create stunning AI-generated images from text prompts with no content restrictions."
            />
            <FeatureCard
              icon={<Eye className="w-6 h-6" />}
              title="Privacy First"
              description="No tracking, no data collection, no third-party sharing. Your data belongs to you."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It <span className="gradient-text">Works</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="01"
              title="Sign In"
              description="Create an account or sign in to access all features. No personal data required."
            />
            <StepCard
              number="02"
              title="Create"
              description="Start chatting or generating images. Your content is encrypted locally."
            />
            <StepCard
              number="03"
              title="Stay Private"
              description="Your conversations never leave your device. Only metadata is logged for compliance."
            />
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Privacy by <span className="gradient-text">Design</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Unlike other AI platforms that store and analyze your conversations,
                LibreAI keeps everything on your device. We use client-side encryption
                to ensure that even if someone gains access to your browser storage,
                your conversations remain unreadable.
              </p>
              <ul className="space-y-4">
                <PrivacyItem
                  icon={<Database className="w-5 h-5" />}
                  text="Conversations stored locally with AES-256 encryption"
                />
                <PrivacyItem
                  icon={<Shield className="w-5 h-5" />}
                  text="Only content hashes logged for legal compliance"
                />
                <PrivacyItem
                  icon={<Lock className="w-5 h-5" />}
                  text="No server-side storage of your prompts or responses"
                />
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-8 flex items-center justify-center">
                <div className="w-full h-full rounded-xl bg-card border border-border p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Encrypted Storage</div>
                      <div className="text-sm text-muted-foreground">AES-256-GCM</div>
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-4/5" />
                    <div className="h-3 bg-muted rounded w-3/5" />
                  </div>
                  <div className="text-xs text-muted-foreground text-center pt-4">
                    Your data stays on your device
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Experience <span className="gradient-text">Freedom</span>?
            </h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of users who value their privacy while enjoying
              unrestricted AI capabilities.
            </p>
            {isAuthenticated ? (
              <Link href="/chat">
                <Button size="lg" className="gap-2 glow">
                  Open Chat
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="gap-2 glow">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">LibreAI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LibreAI. Privacy-first AI platform.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="text-5xl font-bold gradient-text mb-4">{number}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function PrivacyItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <span className="text-foreground">{text}</span>
    </li>
  );
}
