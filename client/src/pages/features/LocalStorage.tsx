import { Link } from "wouter";
import { Helmet } from "react-helmet";

export default function LocalStorage() {
  const faqs = [
    {
      question: "What data is stored locally?",
      answer: "All your chat history, uploaded files, user preferences, and API keys are stored locally in your browser."
    },
    {
      question: "Is my locally stored data encrypted?",
      answer: "Yes. In addition to being stored locally, your data is also end-to-end encrypted with AES-256 encryption."
    },
    {
      question: "What are the downsides of local storage?",
      answer: "The main downside is that your data is tied to a single device and browser. We are actively working on a privacy-preserving solution for multi-device sync."
    },
    {
      question: "How much data can I store locally?",
      answer: "The amount of data you can store is limited by your browser\'s storage capacity, which is typically several gigabytes. This is more than enough for most users."
    },
    {
      question: "Can I back up my data?",
      answer: "Yes. We provide an option to export your data as a JSON file, which you can then store in a secure location."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <Helmet>
        <title>Local Storage - Your Data Stays on Your Device | Chofesh</title>
        <meta name="description" content="Learn how Chofesh\'s local-first architecture and local storage feature ensure your data remains private and on your device, always." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Chofesh - Local Storage",
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
        <h1>Local Storage: Your Data Stays on Your Device</h1>
        <p>At Chofesh, we believe that your data is your property. That\'s why we\'ve built our platform on a local-first architecture, ensuring that your conversations, files, and preferences are stored directly on your device, not on our servers. This fundamental design choice is at the heart of our commitment to your privacy and security.</p>
        
        <h2>How Local Storage Works</h2>
        <ul>
          <li><strong>Browser-Based Storage:</strong> We utilize your browser\'s built-in storage capabilities (IndexedDB and localStorage) to store all your data. This means your data is sandboxed within your browser and is not accessible to other websites or applications.</li>
          <li><strong>No Server-Side Copies:</strong> We do not create any copies of your data on our servers. When you use Chofesh, you are interacting directly with a local application running in your browser.</li>
          <li><strong>Complete User Control:</strong> You have complete control over your data. You can export your data at any time, and if you clear your browser\'s cache, your data will be permanently deleted.</li>
        </ul>

        <h2>Why It Matters</h2>
        <ul>
          <li><strong>Data Sovereignty:</strong> You are the sole owner of your data. You decide where it\'s stored, who has access to it, and when it\'s deleted.</li>
          <li><strong>Enhanced Security:</strong> By keeping your data on your device, we eliminate the risk of server-side data breaches. Even if our servers were compromised, your data would remain safe.</li>
          <li><strong>Offline Access:</strong> Because your data is stored locally, you can access your conversations and notes even when you\'re not connected to the internet. (Note: AI model access requires an internet connection).</li>
          <li><strong>Peace of Mind:</strong> With local storage, you can use Chofesh with the confidence that your sensitive information is not being collected, analyzed, or monetized.</li>
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
          <li><Link href="/features/private-ai-chat"><strong>Private AI Chat:</strong> Learn how local storage is a key component of our private chat feature.</Link></li>
          <li><Link href="/features/byok"><strong>Bring Your Own Key (BYOK):</strong> Your API keys are also stored locally for maximum security.</Link></li>
          <li><Link href="/pricing"><strong>Pricing:</strong> Our pricing model is based on the value we provide, not on monetizing your data.</Link></li>
        </ul>
      </main>
    </div>
  );
}
