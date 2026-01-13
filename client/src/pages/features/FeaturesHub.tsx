import { Link } from "wouter";
import { Helmet } from "react-helmet-async";

export default function FeaturesHub() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Helmet>
        <title>Chofesh Features - Private AI Chat, BYOK, and More</title>
        <meta name="description" content="Explore the powerful, privacy-first features of Chofesh, including encrypted AI chat, local storage, bring your own key (BYOK), smart model routing, and deep research capabilities." />
      </Helmet>
      <main className="prose lg:prose-xl max-w-none">
        <h1>Chofesh Features: AI with Privacy at its Core</h1>
        <p>Chofesh is more than just an AI chat platform; it's a commitment to your privacy and creative freedom. We've built a suite of powerful features designed to give you a top-tier AI experience without compromising your data. Explore how our unique, privacy-first approach sets us apart and empowers you to create, research, and innovate without limits.</p>
        
        <h2>Core Features</h2>
        <ul>
          <li><Link href="/features/private-ai-chat"><strong>Private AI Chat:</strong></Link> Experience AI conversations that are truly yours. All your chats are end-to-end encrypted and stored only on your device.</li>
          <li><Link href="/features/byok"><strong>Bring Your Own Key (BYOK):</strong></Link> Seamlessly integrate your own API keys from providers like OpenAI, Anthropic, and Google for unlimited access to your favorite models.</li>
          <li><Link href="/features/local-storage"><strong>Local Storage:</strong></Link> Your data, your device. We believe in zero data retention on our servers. Your conversations, files, and preferences are stored locally in your browser.</li>
          <li><Link href="/features/model-routing"><strong>Smart Model Routing:</strong></Link> Get the best model for the job, every time. Our intelligent routing system automatically selects from over 20 free and premium models to optimize for speed, cost, and performance.</li>
          <li><Link href="/features/deep-research"><strong>Deep Research:</strong></Link> Go beyond simple search. Our Perplexity-style research tool provides AI-powered summaries with inline citations from multiple sources, giving you reliable and verifiable answers.</li>
        </ul>

        <h2>Why Chofesh?</h2>
        <p>We believe that the future of AI should be private, secure, and user-centric. Our platform is built on three foundational pillars:</p>
        <ol>
          <li><strong>Privacy by Design:</strong> We don't collect or store your data. Period. Everything is encrypted and stored locally.</li>
          <li><strong>Unmatched Flexibility:</strong> With BYOK and smart model routing, you have complete control over your AI experience.</li>
          <li><strong>Powerful Tools:</strong> From uncensored chat to deep research, we provide the tools you need to get things done.</li>
        </ol>

        <p>Ready to experience AI freedom? <Link href="/login">Get started for free</Link> and see the Chofesh difference.</p>
      </main>
    </div>
  );
}
