import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Shield, Lock, Eye, Server, Trash2 } from "lucide-react";
import { useEffect } from "react";

export default function Privacy() {
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/chofesh-logo-48.webp" alt="Chofesh" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold gradient-text">Chofesh</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Privacy Policy</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Your Privacy <span className="gradient-text">Matters</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We built Chofesh with privacy as a core principle. Here's exactly how we handle your data.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </section>

      {/* Trust Statement */}
      <section className="py-8 px-4 bg-primary/10 border-y border-primary/20">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-xl font-semibold text-primary">
            Zero tracking. Zero data sharing. Zero AI training on your content. Only minimal legal compliance logs.
          </p>
        </div>
      </section>

      {/* Quick Summary */}
      <section className="py-12 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">The Short Version</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <SummaryCard
              icon={<Lock className="w-6 h-6" />}
              title="Your conversations stay on your device"
              description="We use client-side encryption. Your chats never touch our servers."
            />
            <SummaryCard
              icon={<Eye className="w-6 h-6" />}
              title="We don't track or monitor you"
              description="No activity tracking, no behavior analysis, no surveillance."
            />
            <SummaryCard
              icon={<Server className="w-6 h-6" />}
              title="We never train AI on your data"
              description="Your content is yours. We don't use it to improve any models."
            />
            <SummaryCard
              icon={<Trash2 className="w-6 h-6" />}
              title="We never share your data"
              description="No third-party sharing. No selling. No exceptions."
            />
          </div>
        </div>
      </section>

      {/* Full Policy */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-invert max-w-none">
            <PolicySection title="1. What We Collect">
              <p>
                Chofesh is designed to minimize data collection. Here's what we do and don't collect:
              </p>
              <h4>What we DO collect:</h4>
              <ul>
                <li><strong>Account information:</strong> Your email address and name when you sign up</li>
                <li><strong>Usage metadata:</strong> Timestamps, model selections, and request counts (not content)</li>
                <li><strong>Technical data:</strong> IP addresses and browser information for security purposes</li>
              </ul>
              <h4>What we DON'T collect:</h4>
              <ul>
                <li>Your conversation content (stored locally on your device)</li>
                <li>Your generated images (stored locally on your device)</li>
                <li>Your uploaded documents (processed in-browser when possible)</li>
                <li>Your API keys (encrypted and only used for your requests)</li>
              </ul>
            </PolicySection>

            <PolicySection title="2. How Your Conversations Work">
              <p>
                Your conversations are encrypted using AES-256-GCM encryption and stored in your browser's local storage. 
                This means:
              </p>
              <ul>
                <li>Conversations never leave your device</li>
                <li>We cannot read, access, or recover your conversations</li>
                <li>If you clear your browser data, your conversations are permanently deleted</li>
                <li>Each device has its own separate conversation history</li>
              </ul>
              <p>
                When you send a message, only the current message is sent to the AI model for processing. 
                The response is returned to your browser and stored locally.
              </p>
            </PolicySection>

            <PolicySection title="3. What We Don't Do">
              <p className="font-semibold text-primary mb-4">
                Unlike most AI platforms, we commit to:
              </p>
              <ul>
                <li><strong>No tracking:</strong> We don't monitor your activities or behavior</li>
                <li><strong>No data sharing:</strong> We never share your information with third parties</li>
                <li><strong>No AI training:</strong> We never use your content to train or improve AI models</li>
                <li><strong>No selling:</strong> Your data is never sold, period</li>
              </ul>
            </PolicySection>

            <PolicySection title="4. Minimal Legal Compliance Logs">
              <p>
                To comply with legal requirements only, we maintain minimal logs that include:
              </p>
              <ul>
                <li>Timestamps of requests</li>
                <li>Type of action (chat, image generation, etc.)</li>
                <li>Model used</li>
                <li>IP address</li>
                <li>Content hash (a cryptographic fingerprint, not the actual content)</li>
              </ul>
              <p>
                <strong>Important:</strong> Content hashes are one-way cryptographic functions. 
                They can verify if specific content was generated but cannot be reversed to reveal the original content.
                This allows us to respond to valid legal requests while protecting your privacy.
              </p>
            </PolicySection>

            <PolicySection title="5. Your API Keys (BYOK)">
              <p>
                If you choose to use your own API keys:
              </p>
              <ul>
                <li>Keys are encrypted before storage using industry-standard encryption</li>
                <li>Keys are only decrypted when making requests on your behalf</li>
                <li>We never log or store your actual API keys in plain text</li>
                <li>You can delete your keys at any time from your settings</li>
              </ul>
            </PolicySection>

            <PolicySection title="6. Data Retention">
              <p>
                <strong>Local data (conversations, images):</strong> Stored indefinitely until you delete them or clear your browser data.
              </p>
              <p>
                <strong>Account data:</strong> Retained while your account is active. You can request deletion at any time.
              </p>
              <p>
                <strong>Audit logs:</strong> Retained for 90 days for security purposes, then automatically deleted.
              </p>
            </PolicySection>

            <PolicySection title="7. Third-Party Services">
              <p>
                When you use Chofesh, your requests may be processed by:
              </p>
              <ul>
                <li><strong>AI Model Providers:</strong> OpenAI, Anthropic, or other providers depending on your model selection</li>
                <li><strong>Authentication:</strong> Manus OAuth for secure sign-in</li>
              </ul>
              <p>
                Each of these services has their own privacy policies. When using BYOK, your requests go directly to your chosen provider.
              </p>
            </PolicySection>

            <PolicySection title="8. Your Rights">
              <p>
                You have the right to:
              </p>
              <ul>
                <li>Access your account data</li>
                <li>Delete your account and associated data</li>
                <li>Export your local conversation data</li>
                <li>Opt out of non-essential data collection</li>
              </ul>
              <p>
                To exercise these rights, contact us at privacy@chofesh.ai.
              </p>
            </PolicySection>

            <PolicySection title="9. Security">
              <p>
                We implement industry-standard security measures including:
              </p>
              <ul>
                <li>HTTPS encryption for all data in transit</li>
                <li>AES-256-GCM encryption for local storage</li>
                <li>Secure authentication via OAuth 2.0</li>
                <li>Regular security audits</li>
              </ul>
            </PolicySection>

            <PolicySection title="10. Changes to This Policy">
              <p>
                We may update this privacy policy from time to time. We will notify you of any significant changes 
                by posting a notice on our website or sending you an email.
              </p>
            </PolicySection>

            <PolicySection title="11. Contact Us">
              <p>
                If you have questions about this privacy policy or our practices, contact us at:
              </p>
              <ul>
                <li>Email: privacy@chofesh.ai</li>
              </ul>
            </PolicySection>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/chofesh-logo-48.webp" alt="Chofesh" className="w-6 h-6 object-contain" />
            <span className="font-semibold">Chofesh</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10">
      <h3 className="text-xl font-bold mb-4 text-foreground">{title}</h3>
      <div className="text-muted-foreground space-y-4 [&_h4]:text-foreground [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_strong]:text-foreground">
        {children}
      </div>
    </div>
  );
}
