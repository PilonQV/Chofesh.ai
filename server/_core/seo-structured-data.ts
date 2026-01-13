/**
 * JSON-LD Structured Data
 * 
 * This file contains the structured data (JSON-LD) for each page type.
 * Structured data helps search engines understand the content and enables rich snippets.
 */

export const structuredData: Record<string, object> = {
  '/': {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Chofesh',
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web',
    description: 'Privacy-first AI chat platform with local-first storage, end-to-end encryption, and access to 20+ AI models.',
    url: 'https://chofesh.ai',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      priceCurrency: 'USD',
      offerCount: '3',
    },
    featureList: [
      'Private AI Chat',
      'Local-First Storage',
      'End-to-End Encryption',
      'Bring Your Own Key (BYOK)',
      'Smart Model Routing',
      'Deep Research',
      '20+ AI Models',
    ],
  },
  '/pricing': {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Chofesh AI Platform',
    description: 'Privacy-first AI chat platform with flexible pricing options.',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Tier',
        price: '0',
        priceCurrency: 'USD',
        description: 'Access to select AI models with usage limits.',
      },
      {
        '@type': 'Offer',
        name: 'Pay-As-You-Go',
        description: 'Purchase credits that never expire, or use your own API keys.',
        priceCurrency: 'USD',
      },
    ],
  },
};

// FAQ structured data for feature pages
const faqData: Record<string, any> = {
  '/features/private-ai-chat': {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is my data truly private?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. All data is encrypted and stored on your device. We have no access to it. Your API keys are also stored locally and sent directly to the model provider, never passing through our servers.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use this for sensitive business information?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Absolutely. Chofesh is designed for professionals handling sensitive data, such as legal documents, financial reports, and source code. The local-first architecture ensures confidentiality.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does this compare to using a VPN with other AI services?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A VPN encrypts your connection but does not prevent the AI service provider from storing and analyzing your data. Chofesh prevents data storage at the source, offering a much higher level of security.',
        },
      },
    ],
  },
  '/features/byok': {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Which API providers are supported?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We support over 10 major providers, including OpenAI (ChatGPT), Google (Gemini), Anthropic (Claude), Mistral, Perplexity, and more. The list is constantly growing.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is it secure to enter my API key?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Your API keys are encrypted and stored only on your local device. They are never sent to our servers. All API calls are made directly from your browser to the provider.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use multiple keys from the same provider?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Currently, you can use one key per provider. We are working on features to allow for multiple key management for different projects.',
        },
      },
    ],
  },
  '/features/local-storage': {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What happens if I clear my browser cache?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Your data is stored using persistent browser storage (IndexedDB), which is not typically cleared with the standard browser cache. However, we recommend exporting your data periodically as a backup.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I sync my data across multiple devices?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Currently, all data is stored locally on a single device. We are exploring secure, end-to-end encrypted syncing solutions for future releases, but will only implement them if we can guarantee zero-knowledge privacy.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is the local data encrypted?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all data stored locally is encrypted to protect it from unauthorized access on your own machine.',
        },
      },
    ],
  },
  '/features/model-routing': {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does the router choose which model to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The router uses a combination of prompt analysis, task complexity assessment, and real-time performance data to make its decision. You can also manually override the selection if you have a preferred model.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does this feature cost extra?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Smart Model Routing is a core feature of the Chofesh platform and is included for all users. You only pay for the underlying model usage via your own API keys.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I customize the routing rules?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Advanced customization of routing rules is a planned feature for a future release, allowing you to prioritize models based on your specific needs (e.g., always use the cheapest model, or always use the most powerful).',
        },
      },
    ],
  },
  '/features/deep-research': {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does Deep Research mode work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'When you ask a question in Deep Research mode, the AI performs a web search across multiple trusted sources, synthesizes the information, and generates a summary with inline citations linking back to the original articles.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is the research biased?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The AI strives to provide a neutral synthesis of the information it finds. By providing multiple sources, we empower you to evaluate the information and identify potential biases in the original articles.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use this for academic research?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'While it is a powerful tool for initial research and literature discovery, we always recommend that you consult the original sources and follow proper academic citation practices. It should be used as a starting point, not a final source.',
        },
      },
    ],
  },
  '/compare/chofesh-vs-chatgpt': {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Chofesh vs. Hosted AI Chat: A Clear Choice for Privacy',
    description: 'Comparison of Chofesh\'s local-first, privacy-focused approach to hosted AI chat platforms like ChatGPT.',
    author: {
      '@type': 'Organization',
      name: 'Chofesh',
    },
  },
};

// Merge FAQ data into structured data
Object.assign(structuredData, faqData);

export function getStructuredData(path: string): string | null {
  const data = structuredData[path];
  if (!data) return null;
  
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
}
