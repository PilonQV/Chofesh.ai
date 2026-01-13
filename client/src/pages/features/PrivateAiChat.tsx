import { Link } from "wouter";
import { Helmet } from "react-helmet-async";

export default function PrivateAiChat() {
  const faqs = [
    {
      question: "Is my data truly private?",
      answer: "Yes. Your data is stored locally on your device and is end-to-end encrypted. We cannot access your conversations, even if we wanted to."
    },
    {
      question: "What happens if I clear my browser cache?",
      answer: "Since your data is stored locally, clearing your browser cache will permanently delete your chat history. We recommend exporting your conversations if you need to keep a record of them."
    },
    {
      question: "Can I access my conversations on multiple devices?",
      answer: "Currently, your conversations are tied to the device and browser you use. We are exploring secure, privacy-preserving ways to enable multi-device sync in the future."
    },
    {
      question: "How does Chofesh compare to other AI chat platforms?",
      answer: "While other platforms may offer similar features, their business models often rely on collecting user data. Chofesh is different because our business model is aligned with your privacy. We offer a premium, privacy-focused service, not a free product where you are the product."
    },
    {
      question: "What is uncensored chat?",
      answer: "Uncensored chat means that we do not impose arbitrary content restrictions on your conversations, as long as they are within legal parameters. This allows for more natural and open discussions."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <Helmet>
        <title>Private AI Chat - Encrypted & Local-First | Chofesh</title>
        <meta name="description" content="Learn how Chofesh's private AI chat keeps your conversations secure with end-to-end encryption and local storage. Your data stays on your device, always." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Chofesh - Private AI Chat",
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
        <h1>Private AI Chat: Your Conversations, Your Control</h1>
        <p>In an era where data privacy is more critical than ever, Chofesh redefines the AI chat experience by putting you in complete control. Our Private AI Chat feature is built on a simple yet powerful promise: your conversations are yours alone. Unlike mainstream AI services that process and store your data on corporate servers, Chofesh ensures that every word you type remains on your device, secured with robust, end-to-end encryption.</p>
        
        <h2>How Private AI Chat Works</h2>
        <p>Our commitment to privacy is not just a policy; it's embedded in our architecture. Here’s how we protect your conversations:</p>
        <ul>
          <li><strong>Local-First Storage:</strong> All your chat history is stored directly in your browser's local storage. This means your data never leaves your device. We have no access to it, and neither does anyone else.</li>
          <li><strong>End-to-End Encryption:</strong> We use AES-256 encryption to secure your conversations. This is the same military-grade encryption standard used by governments and financial institutions worldwide. Your data is encrypted at rest and in transit, ensuring it remains unreadable to any unauthorized parties.</li>
          <li><strong>No Data Retention:</strong> We have a strict zero-data retention policy. We do not log, monitor, or store any of your conversations on our servers. Your privacy is not a feature; it's the foundation of our platform.</li>
        </ul>

        <h2>Why It Matters</h2>
        <p>The difference between Chofesh and other AI chat platforms is fundamental. With Chofesh, you can:</p>
        <ul>
          <li><strong>Discuss sensitive information with confidence:</strong> Whether you're a developer working on proprietary code, a writer drafting a confidential manuscript, or a professional handling sensitive client information, you can use Chofesh without fear of data leaks or corporate surveillance.</li>
          <li><strong>Explore ideas freely:</strong> Our uncensored chat (within legal parameters) allows you to have genuine, unrestricted conversations. You can explore creative and controversial topics without worrying about your data being used to train models or build a profile on you.</li>
          <li><strong>Maintain compliance:</strong> For professionals in fields like healthcare, law, and finance, data privacy is not just a preference; it's a legal requirement. Chofesh provides a compliant environment for AI-powered work.</li>
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
          <li><Link href="/features/local-storage"><strong>Local Storage:</strong> Learn more about how we keep your data on your device.</Link></li>
          <li><Link href="/features/byok"><strong>Bring Your Own Key (BYOK):</strong> Enhance your privacy by using your own API keys.</Link></li>
          <li><Link href="/features/deep-research"><strong>Deep Research:</strong> Conduct in-depth research with the same level of privacy and security.</Link></li>
        </ul>
      </main>
    </div>
  );
}
