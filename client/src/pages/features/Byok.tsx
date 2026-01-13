import { Link } from "wouter";
import { Helmet } from "react-helmet-async";

export default function Byok() {
  const faqs = [
    {
      question: "Is it safe to add my API keys to Chofesh?",
      answer: "Yes. Your API keys are encrypted and stored locally in your browser. We never have access to your keys, and they are not transmitted to our servers."
    },
    {
      question: "Which AI providers are supported?",
      answer: "We support a wide range of providers, including OpenAI, Anthropic, Google, Mistral, and many more. We are constantly adding support for new providers and models."
    },
    {
      question: "How am I billed for usage?",
      answer: "When you use your own API keys, you are billed directly by the AI provider. Chofesh does not charge any additional fees for BYOK usage."
    },
    {
      question: "Can I still use the free models if I add my own API keys?",
      answer: "Yes. You can switch between the free models and your own models at any time."
    },
    {
      question: "What are the benefits of using BYOK over the built-in models?",
      answer: "BYOK gives you access to a wider range of models, including the latest and most powerful models that may not be available through our free tier. It also gives you more control over your costs and a direct relationship with the AI provider."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <Helmet>
        <title>Bring Your Own Key (BYOK) - AI Model Flexibility | Chofesh</title>
        <meta name="description" content="Discover the freedom of Chofesh's BYOK feature. Use your own API keys from OpenAI, Anthropic, Google, and more for ultimate control and flexibility." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Chofesh - Bring Your Own Key (BYOK)",
            "applicationCategory": "Productivity",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0"
            }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })}
        </script>
      </Helmet>
      <main className="prose lg:prose-xl max-w-none">
        <h1>Bring Your Own Key (BYOK): Ultimate Control and Flexibility</h1>
        <p>Chofesh empowers you with unparalleled control over your AI experience through our Bring Your Own Key (BYOK) feature. This allows you to connect your own API keys from a wide range of providers, including OpenAI, Anthropic, Google, and more. With BYOK, you are no longer tied to a single provider or a limited set of models. You gain the freedom to choose the best AI for your needs, all while maintaining the highest level of privacy and security.</p>
        
        <h2>How BYOK Works</h2>
        <ol>
          <li><strong>Add Your API Keys:</strong> In your Chofesh settings, you can securely add your API keys from any supported provider. Your keys are encrypted and stored locally in your browser, ensuring they remain private and under your control.</li>
          <li><strong>Select Your Model:</strong> When you start a new chat, you can choose from any of the models available through your connected API keys. This gives you access to a vast library of cutting-edge AI models, including GPT-4, Claude 3, and Gemini.</li>
          <li><strong>Direct API Access:</strong> When you use a model through BYOK, your requests are sent directly to the provider's API. This means you get the same performance and reliability as you would using the provider's own platform, but with the added benefits of the Chofesh interface and privacy features.</li>
        </ol>

        <h2>Why It Matters</h2>
        <p>BYOK is more than just a feature; it’s a philosophy. We believe that you should have the freedom to choose the tools you use, without being locked into a single ecosystem. With BYOK, you can:</p>
        <ul>
          <li><strong>Access the Latest Models:</strong> The AI landscape is constantly evolving. With BYOK, you can immediately access the latest and most powerful models as soon as they are released.</li>
          <li><strong>Optimize for Cost and Performance:</strong> Different models have different strengths and costs. BYOK allows you to choose the most cost-effective model for your specific task, whether you need a powerful model for complex reasoning or a faster, more affordable model for simple tasks.</li>
          <li><strong>Maintain Privacy and Security:</strong> By using your own API keys, you have a direct relationship with the AI provider. This can provide an additional layer of privacy and security, as your data is not being passed through a third-party platform.</li>
          <li><strong>Unify Your AI Workflow:</strong> Instead of juggling multiple AI platforms, you can consolidate your entire AI workflow within Chofesh. This streamlines your work and improves your productivity.</li>
        </ul>

        <h2>Frequently Asked Questions (FAQ)</h2>
        {faqs.map((faq, index) => (
          <div key={index}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}

        <h2>Related Features</h2>
        <ul>
          <li><Link href="/features/model-routing"><strong>Smart Model Routing:</strong> Learn how Chofesh can automatically select the best model for your task.</Link></li>
          <li><Link href="/features/private-ai-chat"><strong>Private AI Chat:</strong> Combine the power of BYOK with the privacy of our local-first chat.</Link></li>
          <li><Link href="/pricing"><strong>Pricing:</strong> Understand the costs associated with different AI models and providers.</Link></li>
        </ul>
      </main>
    </div>
  );
}
