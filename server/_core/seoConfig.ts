/**
 * SEO Configuration for Chofesh.ai
 * Defines meta tags, Open Graph tags, and structured data for each page
 */

export interface PageSEO {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  schema?: any;
}

const SITE_URL = 'https://chofesh.ai';
const DEFAULT_OG_IMAGE = `${SITE_URL}/chofesh-logo-og.webp`;

/**
 * Organization Schema - Used across all pages
 */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Chofesh.ai",
  "url": SITE_URL,
  "logo": DEFAULT_OG_IMAGE,
  "description": "Privacy-first AI chat platform with local data storage and AES-256 encryption",
  "foundingDate": "2025",
  "sameAs": [
    "https://twitter.com/chofeshai",
    "https://github.com/serever-coder357/Chofesh.ai"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Support",
    "email": "support@chofesh.ai"
  }
};

/**
 * Product Schema - Used on homepage and pricing page
 */
export const productSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Chofesh.ai",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "Privacy-first AI chat platform with 25+ AI models, local data storage, and AES-256 encryption",
  "url": SITE_URL,
  "image": DEFAULT_OG_IMAGE,
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "USD",
    "lowPrice": "5",
    "highPrice": "99",
    "offerCount": "4"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "127"
  },
  "featureList": [
    "25+ AI Models",
    "Local Data Storage",
    "AES-256 Encryption",
    "BYOK (Bring Your Own Keys)",
    "Code Execution (60+ Languages)",
    "Deep Research Mode",
    "Image Generation",
    "Voice Transcription"
  ]
};

/**
 * SEO Configuration for each page
 */
export const seoConfig: Record<string, PageSEO> = {
  '/': {
    title: 'Chofesh.ai - Privacy-First AI Chat with Local Storage',
    description: 'Access 25+ AI models while keeping your data private. True local storage with AES-256 encryption. No data collection. BYOK supported. Start with 30 free credits daily.',
    keywords: ['private AI chat', 'local AI storage', 'encrypted AI', 'BYOK AI', 'privacy-first AI', 'AI chat platform'],
    ogType: 'website',
    schema: [organizationSchema, productSchema]
  },
  
  '/features': {
    title: 'Features - Privacy, Security & Power | Chofesh.ai',
    description: 'Discover Chofesh.ai features: local data storage, AES-256 encryption, 25+ AI models, BYOK, code execution, deep research mode, and more. Privacy-first AI chat.',
    keywords: ['AI features', 'private AI', 'local storage', 'encryption', 'BYOK', 'code execution'],
    ogType: 'website',
    schema: [organizationSchema]
  },
  
  '/features/private-ai-chat': {
    title: 'Private AI Chat - Zero Data Collection | Chofesh.ai',
    description: 'Chat with 25+ AI models without data collection. Your conversations stay on your device with AES-256 encryption. True privacy-first AI chat platform.',
    keywords: ['private AI chat', 'encrypted chat', 'zero data collection', 'privacy AI'],
    ogType: 'article',
    schema: [organizationSchema]
  },
  
  '/features/byok': {
    title: 'BYOK - Bring Your Own Keys | Chofesh.ai',
    description: 'Use your own API keys for OpenAI, Anthropic, and more. Direct relationship with AI providers. Full control over your AI usage and costs.',
    keywords: ['BYOK', 'bring your own keys', 'AI API keys', 'OpenAI API', 'Anthropic API'],
    ogType: 'article',
    schema: [organizationSchema]
  },
  
  '/features/local-storage': {
    title: 'Local Data Storage - AES-256 Encryption | Chofesh.ai',
    description: 'Your conversations are stored locally on your device with AES-256 encryption. No cloud storage. No server access. Complete privacy.',
    keywords: ['local storage', 'AES-256 encryption', 'encrypted storage', 'privacy storage'],
    ogType: 'article',
    schema: [organizationSchema]
  },
  
  '/features/model-routing': {
    title: 'Smart Model Routing - Auto-Select Best AI | Chofesh.ai',
    description: 'Intelligent model routing automatically selects the best AI model for your task. Optimize for cost, speed, or quality. 25+ models available.',
    keywords: ['model routing', 'AI model selection', 'smart routing', 'AI optimization'],
    ogType: 'article',
    schema: [organizationSchema]
  },
  
  '/features/deep-research': {
    title: 'Deep Research Mode - AI-Powered Research | Chofesh.ai',
    description: 'Advanced research mode with web search, multi-step reasoning, and source citation. Perfect for journalists, researchers, and professionals.',
    keywords: ['AI research', 'deep research', 'web search AI', 'research mode'],
    ogType: 'article',
    schema: [organizationSchema]
  },
  
  '/pricing': {
    title: 'Pricing - Affordable AI Chat Plans | Chofesh.ai',
    description: 'Flexible pricing starting at $5. Pay-as-you-go credits that never expire. 30 free credits daily. No subscriptions required. Enterprise plans available.',
    keywords: ['AI pricing', 'AI chat pricing', 'affordable AI', 'pay-as-you-go AI'],
    ogType: 'website',
    schema: [organizationSchema, productSchema]
  },
  
  '/compare/chofesh-vs-chatgpt': {
    title: 'Chofesh vs ChatGPT - Privacy Comparison | Chofesh.ai',
    description: 'Compare Chofesh.ai and ChatGPT. Learn how Chofesh protects your privacy with local storage while ChatGPT collects your data. See the differences.',
    keywords: ['Chofesh vs ChatGPT', 'ChatGPT alternative', 'private ChatGPT', 'AI comparison'],
    ogType: 'article',
    schema: [organizationSchema]
  },
  
  '/privacy': {
    title: 'Privacy Policy - Your Data, Your Control | Chofesh.ai',
    description: 'Read our privacy policy. We don\'t collect, store, or sell your data. Everything stays on your device. Complete transparency.',
    keywords: ['privacy policy', 'data privacy', 'AI privacy'],
    ogType: 'website',
    schema: [organizationSchema]
  },
  
  '/terms': {
    title: 'Terms of Service - Chofesh.ai',
    description: 'Read our terms of service. Fair, transparent, and user-friendly terms for using Chofesh.ai.',
    keywords: ['terms of service', 'terms and conditions'],
    ogType: 'website',
    schema: [organizationSchema]
  }
};

/**
 * Get SEO configuration for a specific page
 */
export function getSEOForPage(path: string): PageSEO {
  // Normalize path (remove trailing slash)
  const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '');
  
  // Return page-specific SEO or default
  return seoConfig[normalizedPath] || {
    title: 'Chofesh.ai - Privacy-First AI Chat',
    description: 'Privacy-first AI chat platform with local data storage',
    ogType: 'website',
    schema: [organizationSchema]
  };
}

/**
 * Generate HTML meta tags for a page
 */
export function generateMetaTags(path: string): string {
  const seo = getSEOForPage(path);
  const canonical = seo.canonical || `${SITE_URL}${path}`;
  const ogImage = seo.ogImage || DEFAULT_OG_IMAGE;
  
  return `
    <!-- Primary Meta Tags -->
    <title>${seo.title}</title>
    <meta name="title" content="${seo.title}" />
    <meta name="description" content="${seo.description}" />
    ${seo.keywords ? `<meta name="keywords" content="${seo.keywords.join(', ')}" />` : ''}
    <link rel="canonical" href="${canonical}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${seo.ogType || 'website'}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${seo.title}" />
    <meta property="og:description" content="${seo.description}" />
    <meta property="og:image" content="${ogImage}" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${canonical}" />
    <meta property="twitter:title" content="${seo.title}" />
    <meta property="twitter:description" content="${seo.description}" />
    <meta property="twitter:image" content="${ogImage}" />
  `;
}

/**
 * Generate JSON-LD structured data for a page
 */
export function generateStructuredData(path: string): string {
  const seo = getSEOForPage(path);
  
  if (!seo.schema) {
    return '';
  }
  
  const schemas = Array.isArray(seo.schema) ? seo.schema : [seo.schema];
  
  return schemas.map(schema => 
    `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`
  ).join('\n');
}
