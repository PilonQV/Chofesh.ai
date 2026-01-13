import { Link } from "wouter";
import { Helmet } from "react-helmet";

export default function Compare() {
  const faqs = [
    {
      question: "Is Chofesh as powerful as hosted AI chat platforms?",
      answer: "Yes. Chofesh gives you access to the same powerful models as hosted platforms, including GPT-4, Claude 3, and Gemini. The difference is that we do it in a way that respects your privacy."
    },
    {
      question: "Can I use Chofesh for free?",
      answer: "Yes. We offer a generous free tier that includes 30 free credits every day. You can also use your own API keys with our BYOK feature at no extra cost."
    },
    {
      question: "Is Chofesh more difficult to use than hosted platforms?",
      answer: "No. Chofesh is designed to be simple and intuitive. Our user-friendly interface makes it easy to get started, and our Smart Model Routing feature automatically selects the best model for your task."
    },
    {
      question: "What if I need to access my conversations on multiple devices?",
      answer: "Currently, your conversations are stored locally on your device. We are working on a privacy-preserving solution for multi-device sync."
    },
    {
      question: "How can I be sure that my data is not being collected?",
      answer: "Our commitment to privacy is not just a promise; it’s built into our architecture. Our local-first design makes it technically impossible for us to access your data. We also have a strict zero-data retention policy, which is outlined in our privacy policy."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <Helmet>
        <title>Chofesh vs. Hosted AI Chat - A Clear Choice for Privacy</title>
        <meta name="description" content="Compare Chofesh's local-first, privacy-focused approach to hosted AI chat platforms like ChatGPT. See why Chofesh is the clear choice for data privacy." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Chofesh vs. Hosted AI Chat",
            "url": "https://chofesh.ai/compare/chofesh-vs-chatgpt"
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
        <h1>Chofesh vs. Hosted AI Chat: A Clear Choice for Privacy</h1>
        <p>When it comes to choosing an AI chat platform, the market is flooded with options. However, most of these platforms, including popular services like ChatGPT, operate on a hosted model. This means your data is sent to their servers for processing and storage, creating significant privacy and security risks. Chofesh, on the other hand, is built on a fundamentally different architecture—a local-first approach that puts you in control.</p>
        
        <h2>The Hosted AI Chat Model: What You Give Up for Convenience</h2>
        <p>Hosted AI chat platforms are convenient, but that convenience comes at a cost. When you use these services, you are entrusting your most sensitive conversations to a third party. Here’s what that means:</p>
        <ul>
          <li><strong>Data Collection:</strong> Your conversations are collected and stored on corporate servers. This data is often used to train AI models, which means your private information could become part of a public-facing AI.</li>
          <li><strong>Security Risks:</strong> Storing data on a central server creates a single point of failure. If the provider’s servers are breached, your data could be exposed.</li>
          <li><strong>Lack of Control:</strong> You have limited control over your data. You may not be able to delete it permanently, and you have no say in how it is used.</li>
          <li><strong>Censorship and Bias:</strong> Hosted AI platforms often have strict content filters and biases that can limit your creative freedom and access to information.</li>
        </ul>

        <h2>The Chofesh Difference: Privacy by Design</h2>
        <p>Chofesh is designed from the ground up to protect your privacy. Our local-first architecture means that your data never leaves your device. Here’s how we compare to hosted AI chat platforms:</p>
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Chofesh</th>
              <th>Hosted AI Chat (e.g., ChatGPT)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Data Storage</strong></td>
              <td>Local-first (on your device)</td>
              <td>Server-side (on their servers)</td>
            </tr>
            <tr>
              <td><strong>Encryption</strong></td>
              <td>End-to-end (AES-256)</td>
              <td>In transit (may not be end-to-end)</td>
            </tr>
            <tr>
              <td><strong>Data Retention</strong></td>
              <td>Zero data retention on our servers</td>
              <td>Data is retained for model training</td>
            </tr>
            <tr>
              <td><strong>Privacy</strong></td>
              <td>Your data is private and secure</td>
              <td>Your data is used to train their models</td>
            </tr>
            <tr>
              <td><strong>Control</strong></td>
              <td>You have complete control over your data</td>
              <td>You have limited control over your data</td>
            </tr>
            <tr>
              <td><strong>Flexibility</strong></td>
              <td>BYOK and Smart Model Routing</td>
              <td>Limited to the provider’s models</td>
            </tr>
            <tr>
              <td><strong>Censorship</strong></td>
              <td>Uncensored chat (within legal limits)</td>
              <td>Strict content filters and biases</td>
            </tr>
          </tbody>
        </table>

        <h2>Why Choose Chofesh?</h2>
        <p>The choice is clear. If you value your privacy and want to have complete control over your data, Chofesh is the only option. With Chofesh, you get the best of both worlds: the power of a state-of-the-art AI platform and the peace of mind that comes with knowing your data is safe and secure.</p>

        <h2>Frequently Asked Questions (FAQ)</h2>
        {faqs.map((faq, index) => (
          <div key={index}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}

        <h2>Ready to Make the Switch?</h2>
        <p><Link href="/register">Experience the Chofesh difference for yourself.</Link> Sign up for free and take back control of your data.</p>
      </main>
    </div>
  );
}
