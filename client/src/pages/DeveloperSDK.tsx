import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { useState } from "react";
import {
  ArrowLeft,
  Book,
  Code,
  Terminal,
  Zap,
  Copy,
  Check,
  MessageSquare,
  Image,
  Search,
  FileText,
  Key,
  Shield,
  Rocket,
  Github,
  ExternalLink,
  ChevronRight,
  Braces,
  Database,
  Globe,
  Lock,
  Users,
  Cpu,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function DeveloperSDK() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language, id }: { code: string; language: string; id: string }) => (
    <div className="relative group">
      <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto text-sm">
        <code className={`language-${language} text-zinc-300`}>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedCode === id ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Braces className="w-5 h-5 text-primary" />
              <h1 className="font-semibold">Developer SDK</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/chat">
              <Button variant="outline" size="sm">
                Try Chat
              </Button>
            </Link>
            <a href="https://github.com/chofesh" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon">
                <Github className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="container py-8 px-4 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-primary/20 text-primary">
            <Sparkles className="w-3 h-3 mr-1" />
            98% Test Coverage • 167+ Tests
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Build with <span className="gradient-text">Chofesh.ai</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Integrate powerful AI capabilities into your applications. Chat, image generation, 
            web search, document analysis, and more — all through a simple, unified API.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button size="lg" className="gap-2">
              <Rocket className="w-4 h-4" />
              Get Started
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <Book className="w-4 h-4" />
              View Docs
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary">25+</div>
              <p className="text-sm text-muted-foreground">AI Models</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary">98%</div>
              <p className="text-sm text-muted-foreground">Test Coverage</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary">167+</div>
              <p className="text-sm text-muted-foreground">Unit Tests</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary">&lt;100ms</div>
              <p className="text-sm text-muted-foreground">Avg Response</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Quick Start
            </CardTitle>
            <CardDescription>Get up and running in minutes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                Install the SDK
              </h3>
              <CodeBlock
                code="npm install @chofesh/sdk"
                language="bash"
                id="install"
              />
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
                Initialize the Client
              </h3>
              <CodeBlock
                code={`import { ChofeshClient } from '@chofesh/sdk';

const client = new ChofeshClient({
  apiKey: process.env.CHOFESH_API_KEY,
});`}
                language="typescript"
                id="init"
              />
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</span>
                Make Your First Request
              </h3>
              <CodeBlock
                code={`// Chat completion
const response = await client.chat.send({
  message: "Hello, how can you help me today?",
  model: "gpt-4o-mini", // or any of 25+ models
});

console.log(response.content);`}
                language="typescript"
                id="first-request"
              />
            </div>
          </CardContent>
        </Card>

        {/* API Reference Tabs */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              API Reference
            </CardTitle>
            <CardDescription>Explore all available endpoints and features</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-4">
                <TabsTrigger value="chat" className="gap-1">
                  <MessageSquare className="w-3 h-3" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="image" className="gap-1">
                  <Image className="w-3 h-3" />
                  Images
                </TabsTrigger>
                <TabsTrigger value="search" className="gap-1">
                  <Search className="w-3 h-3" />
                  Search
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-1">
                  <FileText className="w-3 h-3" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="auth" className="gap-1">
                  <Key className="w-3 h-3" />
                  Auth
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <h3 className="text-lg font-semibold">Chat API</h3>
                  <p className="text-muted-foreground">
                    Send messages and receive AI-powered responses. Supports streaming, 
                    conversation history, and multiple AI models.
                  </p>
                </div>
                <CodeBlock
                  code={`// Basic chat
const response = await client.chat.send({
  message: "Explain quantum computing",
  model: "claude-3-sonnet",
});

// With conversation history
const response = await client.chat.send({
  message: "Continue from where we left off",
  conversationId: "conv_123",
  model: "gpt-4o",
});

// Streaming response
const stream = await client.chat.stream({
  message: "Write a poem about AI",
  model: "llama-3.3-70b",
});

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}`}
                  language="typescript"
                  id="chat-api"
                />
              </TabsContent>

              <TabsContent value="image" className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <h3 className="text-lg font-semibold">Image Generation API</h3>
                  <p className="text-muted-foreground">
                    Generate stunning images from text prompts using state-of-the-art models 
                    like FLUX, DALL-E, and Stable Diffusion.
                  </p>
                </div>
                <CodeBlock
                  code={`// Generate an image
const image = await client.image.generate({
  prompt: "A futuristic city at sunset, cyberpunk style",
  model: "flux",
  aspectRatio: "16:9",
  steps: 30,
});

console.log(image.url);

// Edit an existing image
const edited = await client.image.edit({
  imageUrl: "https://example.com/image.png",
  prompt: "Add flying cars to the scene",
});`}
                  language="typescript"
                  id="image-api"
                />
              </TabsContent>

              <TabsContent value="search" className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <h3 className="text-lg font-semibold">Web Search API</h3>
                  <p className="text-muted-foreground">
                    Perform intelligent web searches with AI-powered summaries and 
                    inline citations. Perfect for research and fact-checking.
                  </p>
                </div>
                <CodeBlock
                  code={`// Search the web
const results = await client.search.web({
  query: "Latest developments in AI",
  maxResults: 10,
});

// Get AI summary with citations
const summary = await client.search.summarize({
  query: "What is quantum computing?",
  includeCitations: true,
});

console.log(summary.answer);
console.log(summary.sources);`}
                  language="typescript"
                  id="search-api"
                />
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <h3 className="text-lg font-semibold">Document Analysis API</h3>
                  <p className="text-muted-foreground">
                    Upload and analyze documents. Extract information, summarize content, 
                    and chat with your documents using AI.
                  </p>
                </div>
                <CodeBlock
                  code={`// Upload a document
const doc = await client.documents.upload({
  file: pdfBuffer,
  filename: "report.pdf",
});

// Chat with the document
const answer = await client.documents.chat({
  documentId: doc.id,
  question: "What are the key findings?",
});

// Get document summary
const summary = await client.documents.summarize({
  documentId: doc.id,
  maxLength: 500,
});`}
                  language="typescript"
                  id="documents-api"
                />
              </TabsContent>

              <TabsContent value="auth" className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <h3 className="text-lg font-semibold">Authentication API</h3>
                  <p className="text-muted-foreground">
                    Secure OAuth-based authentication with session management. 
                    Supports multiple login providers including Google, GitHub, and email.
                  </p>
                </div>
                <CodeBlock
                  code={`// Exchange authorization code for token
const token = await client.auth.exchangeCode({
  code: authorizationCode,
  state: stateParam,
});

// Get user information
const user = await client.auth.getUserInfo({
  accessToken: token.accessToken,
});

// Create session token
const session = await client.auth.createSession({
  openId: user.openId,
  expiresInMs: 86400000, // 24 hours
});

// Verify session
const verified = await client.auth.verifySession({
  sessionToken: session.token,
});`}
                  language="typescript"
                  id="auth-api"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Why Choose Chofesh SDK?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Cpu className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">25+ AI Models</h3>
                <p className="text-sm text-muted-foreground">
                  Access GPT-4, Claude, Llama, Gemini, and more through a single unified API.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Enterprise Security</h3>
                <p className="text-sm text-muted-foreground">
                  Built-in prompt injection protection, rate limiting, and audit logging.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">
                  Optimized for speed with Cerebras integration for sub-500ms responses.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Persistent Memory</h3>
                <p className="text-sm text-muted-foreground">
                  AI remembers context across conversations with built-in memory management.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">BYOK Support</h3>
                <p className="text-sm text-muted-foreground">
                  Bring Your Own Keys for complete control over your AI infrastructure.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Web Search</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time web search with AI summaries and automatic citations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Available Models */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Available Models</CardTitle>
            <CardDescription>Choose from our extensive collection of AI models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                "GPT-4o", "GPT-4o-mini", "Claude 3.5 Sonnet", "Claude 3 Opus",
                "Llama 3.3 70B", "Llama 3.1 405B", "Gemini 2.0 Flash", "Gemini Pro",
                "DeepSeek R1", "Mistral Large", "Qwen 2.5", "Cerebras Llama",
                "FLUX", "DALL-E 3", "Stable Diffusion", "And more..."
              ].map((model) => (
                <div
                  key={model}
                  className="px-3 py-2 rounded-lg bg-muted/50 text-sm text-center hover:bg-muted transition-colors"
                >
                  {model}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Ready to Build?</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Start building intelligent applications today. Get your API key and 
              access all features with our generous free tier.
            </p>
            <div className="flex items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link href="/settings">
                  <Button size="lg" className="gap-2">
                    <Key className="w-4 h-4" />
                    Get API Key
                  </Button>
                </Link>
              ) : (
                <Button size="lg" className="gap-2" onClick={() => window.location.href = "/login"}>
                  <Key className="w-4 h-4" />
                  Sign Up for Free
                </Button>
              )}
              <a href="https://github.com/chofesh" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="gap-2">
                  <Github className="w-4 h-4" />
                  View on GitHub
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Chofesh.ai. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
