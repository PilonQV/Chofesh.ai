import { Link } from "wouter";
import { Helmet } from "react-helmet";

export default function ModelRouting() {
  const faqs = [
    {
      question: "Can I choose my own models?",
      answer: "Yes. You can disable automatic routing and manually select your preferred model at any time."
    },
    {
      question: "How does the system decide which model is best?",
      answer: "Our system uses a combination of prompt analysis, model performance data, and cost considerations to make its decision. We are constantly refining our routing algorithms to improve their accuracy and efficiency."
    },
    {
      question: "Which models are included in the free tier?",
      answer: "We offer a generous free tier that includes access to over 20 powerful models from providers like DeepSeek, Llama, and Mistral."
    },
    {
      question: "How does this work with BYOK?",
      answer: "If you have connected your own API keys, our Smart Model Routing system can also include your personal models in its selection process. This gives you even more flexibility and control."
    },
    {
      question: "Is the model routing system customizable?",
      answer: "We are working on advanced features that will allow users to create custom routing rules and preferences. Stay tuned for updates!"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <Helmet>
        <title>Smart Model Routing - The Best AI for Every Task | Chofesh</title>
        <meta name="description" content="Discover how Chofesh's Smart Model Routing automatically selects the best AI model for your task, optimizing for speed, cost, and performance." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Chofesh - Smart Model Routing",
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
        <h1>Smart Model Routing: The Best AI for Every Task</h1>
        <p>In the rapidly evolving world of AI, choosing the right model for a specific task can be a complex and time-consuming process. Chofesh simplifies this with our intelligent Smart Model Routing feature. This powerful system automatically selects the best AI model from a pool of over 20 free and premium options, optimizing for speed, cost, and performance. With Smart Model Routing, you get the power of a multi-model AI platform with the simplicity of a single chat interface.</p>
        
        <h2>How Smart Model Routing Works</h2>
        <ul>
          <li><strong>Prompt Analysis:</strong> When you send a message, our system analyzes the content and intent of your prompt. It identifies keywords, complexity, and the type of task you are trying to accomplish (e.g., coding, writing, analysis).</li>
          <li><strong>Model Selection:</strong> Based on this analysis, the system selects the best model from our extensive library. For simple tasks, it might choose a fast and affordable model. For complex reasoning, it will select a more powerful, state-of-the-art model.</li>
          <li><strong>Dynamic Fallback:</strong> If a model is unavailable or fails to respond, our system automatically falls back to the next best option, ensuring you always get a response.</li>
          <li><strong>User Override:</strong> While our automated routing is powerful, you always have the final say. You can manually select your preferred model at any time, giving you complete control over your AI experience.</li>
        </ul>

        <h2>Why It Matters</h2>
        <ul>
          <li><strong>Effortless Optimization:</strong> You no longer need to be an AI expert to get the best results. Our system does the heavy lifting for you, ensuring you always have the right tool for the job.</li>
          <li><strong>Cost Savings:</strong> By automatically selecting the most cost-effective model for each task, Smart Model Routing can significantly reduce your AI spending.</li>
          <li><strong>Access to a Diverse Range of Models:</strong> Our platform integrates with a wide variety of AI providers, giving you access to a diverse range of models with different strengths and capabilities.</li>
          <li><strong>Future-Proof Your Workflow:</strong> As new and improved models are released, we integrate them into our platform. This means you always have access to the latest and greatest AI technology without having to change your workflow.</li>
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
          <li><Link href="/features/byok"><strong>Bring Your Own Key (BYOK):</strong> Expand your model library by connecting your own API keys.</Link></li>
          <li><Link href="/features/private-ai-chat"><strong>Private AI Chat:</strong> Enjoy the benefits of smart model routing with the assurance of complete privacy.</Link></li>
          <li><Link href="/pricing"><strong>Pricing:</strong> Learn more about the costs associated with our premium models.</Link></li>
        </ul>
      </main>
    </div>
  );
}
