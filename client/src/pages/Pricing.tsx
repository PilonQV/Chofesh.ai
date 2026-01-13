import { Link } from "wouter";
import { Helmet } from "react-helmet";

export default function Pricing() {
  const faqs = [
    {
      question: "Do my credits expire?",
      answer: "No. Your credits never expire. You can use them whenever you want."
    },
    {
      question: "Are there any subscription plans?",
      answer: "No. We believe in a simple, pay-as-you-go model. You only pay for what you use."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, as well as Apple Pay and Google Pay."
    },
    {
      question: "Can I get a refund?",
      answer: "We do not offer refunds on credit purchases. However, if you have any issues with our platform, please contact our support team, and we will do our best to resolve them."
    },
    {
      question: "How does BYOK work with pricing?",
      answer: "When you use your own API keys, you are not charged any credits by Chofesh. You are billed directly by the AI provider for your usage."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <Helmet>
        <title>Pricing - Simple, Transparent, and Fair | Chofesh</title>
        <meta name="description" content="Discover Chofesh's simple and transparent pay-as-you-go pricing. No subscriptions, no hidden fees, and your credits never expire." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Chofesh Pricing",
            "url": "https://chofesh.ai/pricing"
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
        <h1>Chofesh Pricing: Simple, Transparent, and Fair</h1>
        <p>At Chofesh, we believe in a straightforward and honest approach to pricing. That’s why we’ve designed a simple, pay-as-you-go model that puts you in control. No subscriptions, no hidden fees, and your credits never expire. Whether you’re a casual user or a power user, we have a plan that’s right for you.</p>
        
        <h2>Free Daily Credits</h2>
        <p>Every day, you get 30 free credits to use on our platform. This is our way of saying thank you for being a part of the Chofesh community. Your free credits are automatically refreshed every 24 hours.</p>

        <h2>Pay-As-You-Go</h2>
        <p>Need more credits? No problem. You can purchase additional credits at any time. Our credit packs offer great value and flexibility, and they never expire.</p>
        <ul>
          <li><strong>Starter Pack:</strong> 300 credits for $5</li>
          <li><strong>Standard Pack:</strong> 1,000 credits for $12</li>
          <li><strong>Pro Pack:</strong> 3,500 credits for $35</li>
          <li><strong>Power Pack:</strong> 12,000 credits for $99</li>
        </ul>

        <h2>Bring Your Own Key (BYOK)</h2>
        <p>If you have your own API keys from providers like OpenAI, Anthropic, or Google, you can use them with Chofesh at no extra cost. You only pay for what you use, directly to the provider. This gives you unlimited access to your favorite models with the added benefits of the Chofesh interface and privacy features.</p>

        <h2>How Credits Are Used</h2>
        <p>Credits are used to pay for AI model usage on our platform. The cost of each model is clearly displayed, so you always know what you’re spending.</p>
        <ul>
          <li><strong>Free Models:</strong> 1 credit per request</li>
          <li><strong>Standard Models:</strong> 2 credits per request</li>
          <li><strong>Premium Models:</strong> 8 credits per request</li>
          <li><strong>Image Generation:</strong> 3 credits per image</li>
        </ul>

        <h2>Frequently Asked Questions (FAQ)</h2>
        {faqs.map((faq, index) => (
          <div key={index}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}

        <h2>Ready to Get Started?</h2>
        <p><Link href="/register">Sign up for free</Link> and get 30 free credits today. Experience the power and privacy of Chofesh for yourself.</p>
      </main>
    </div>
  );
}
