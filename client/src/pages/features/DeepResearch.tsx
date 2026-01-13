import { Link } from "wouter";
import { Helmet } from "react-helmet-async";

export default function DeepResearch() {
  const faqs = [
    {
      question: "How is this different from a standard search engine?",
      answer: "While standard search engines provide a list of links, our Deep Research feature provides a synthesized answer to your question, complete with inline citations. This saves you the time and effort of having to click through multiple links and piece together the information yourself."
    },
    {
      question: "Can I trust the information provided by the AI?",
      answer: "We have designed our system to be as accurate and reliable as possible. However, we always recommend that you verify the information by checking the sources provided."
    },
    {
      question: "Is the Deep Research feature available in the free tier?",
      answer: "Yes. The Deep Research feature is available to all users, including those on our free tier."
    },
    {
      question: "Can I use this feature for academic research?",
      answer: "Yes. The Deep Research feature is a great tool for academic research. The inline citations make it easy to track your sources and build a bibliography."
    },
    {
      question: "What kind of topics can I research?",
      answer: "You can research any topic you can think of, from science and technology to history and art. Our system is constantly learning and expanding its knowledge base."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <Helmet>
        <title>Deep Research - AI-Powered Insights with Verifiable Sources | Chofesh</title>
        <meta name="description" content="Discover how Chofesh's Deep Research feature provides AI-powered summaries with inline citations, delivering in-depth insights and verifiable answers you can trust." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Chofesh - Deep Research",
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
        <h1>Deep Research: AI-Powered Insights with Verifiable Sources</h1>
        <p>In the age of information overload, finding reliable and accurate answers can be a challenge. Chofesh's Deep Research feature transforms the way you search for information, providing AI-powered summaries with inline citations from multiple sources. This Perplexity-style research tool goes beyond simple search, delivering in-depth insights and verifiable answers you can trust.</p>
        
        <h2>How Deep Research Works</h2>
        <ul>
          <li><strong>Multi-Source Analysis:</strong> When you ask a question, our system scours the web, pulling information from a wide range of reputable sources. It then uses AI to analyze and synthesize this information, providing a concise and comprehensive summary.</li>
          <li><strong>Inline Citations:</strong> Every piece of information in our AI-generated summaries is linked to its source. This allows you to easily verify the information and dig deeper into the topics that interest you.</li>
          <li><strong>Unbiased and Objective:</strong> We are committed to providing unbiased and objective information. Our system is designed to present a balanced view of the topics you are researching, drawing from a diverse range of sources to avoid bias and misinformation.</li>
        </ul>

        <h2>Why It Matters</h2>
        <ul>
          <li><strong>Save Time and Effort:</strong> Instead of spending hours sifting through search results, you can get a comprehensive overview of any topic in seconds.</li>
          <li><strong>Improve the Quality of Your Research:</strong> Our AI-powered summaries and inline citations help you to quickly identify the most important information and verify its accuracy.</li>
          <li><strong>Gain a Deeper Understanding:</strong> By drawing from multiple sources, our system provides a more nuanced and complete understanding of complex topics.</li>
          <li><strong>Stay Up-to-Date:</strong> Our system is constantly crawling the web, ensuring you always have access to the latest information.</li>
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
          <li><Link href="/features/private-ai-chat"><strong>Private AI Chat:</strong> Conduct your research with the assurance of complete privacy.</Link></li>
          <li><Link href="/features/local-storage"><strong>Local Storage:</strong> Your research history is stored locally on your device.</Link></li>
          <li><Link href="/features/model-routing"><strong>Smart Model Routing:</strong> Our system automatically selects the best model for your research queries.</Link></li>
        </ul>
      </main>
    </div>
  );
}
