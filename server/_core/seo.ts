/**
 * SEO Middleware
 * 
 * This middleware injects SEO-optimized content into the HTML response for marketing pages.
 * It uses the "Visible Preface" pattern, injecting substantial HTML content (H1, paragraphs, FAQs)
 * directly into the <main id="root"> element before React hydration.
 * 
 * This ensures that search engines see real, indexable content, not just an empty SPA shell.
 */

import { type Request, type Response, type NextFunction } from 'express';
import { seoPageContent } from './seo-content.js';
import { getStructuredData } from './seo-structured-data.js';

interface PageMetadata {
  title: string;
  description: string;
  canonical: string;
  ogType?: string;
  keywords?: string[];
}

const SITE_URL = process.env.VITE_APP_URL || 'http://localhost:3000';
const SITE_NAME = process.env.SITE_NAME || 'AI Gateway';

const pageMetadata: Record<string, PageMetadata> = {
  '/': {
    title: `${SITE_NAME} — Private AI Chat (Encrypted, Local-First, Multi-Model, BYOK)`,
    description: 'Open source multi-provider AI infrastructure. Generate text and images freely. Your conversations stay on your device, always.',
    canonical: `${SITE_URL}/`,
    keywords: ['private AI chat', 'local AI storage', 'encrypted AI', 'BYOK AI', 'privacy-first AI', 'AI chat platform', 'local-first AI', 'zero data collection'],
  },
  '/features': {
    title: `Features - Privacy-First AI Platform | ${SITE_NAME}`,
    description: 'Explore powerful features: private AI chat, BYOK support, local-first storage, smart model routing, and deep research capabilities.',
    canonical: `${SITE_URL}/features`,
    keywords: ['AI features', 'private AI', 'local storage', 'encryption', 'BYOK', 'code execution', 'model routing'],
  },
  '/features/private-ai-chat': {
    title: `Private AI Chat - Encrypted & Local-First | ${SITE_NAME}`,
    description: 'Private AI chat keeps your conversations secure with end-to-end encryption and on-device storage. No data retention, ever.',
    canonical: `${SITE_URL}/features/private-ai-chat`,
    ogType: 'article',
    keywords: ['private AI chat', 'encrypted chat', 'zero data collection', 'privacy AI', 'secure AI chat', 'confidential AI'],
  },
  '/features/byok': {
    title: `Bring Your Own Key (BYOK) - Control Your AI Usage | ${SITE_NAME}`,
    description: 'Use your own API keys from OpenAI, Google, Anthropic, and more. Full control over billing, usage, and data with BYOK model.',
    canonical: `${SITE_URL}/features/byok`,
    ogType: 'article',
    keywords: ['BYOK', 'bring your own keys', 'AI API keys', 'OpenAI API', 'Anthropic API', 'own API key'],
  },
  '/features/local-storage': {
    title: `Local-First Storage - Your Data Stays on Your Device | ${SITE_NAME}`,
    description: 'All your data is encrypted and stored locally on your device. No cloud storage, no server-side retention. Complete data sovereignty.',
    canonical: `${SITE_URL}/features/local-storage`,
    ogType: 'article',
  },
  '/features/model-routing': {
    title: `Smart Model Routing - Best AI for Every Task | ${SITE_NAME}`,
    description: 'Our intelligent router automatically selects the optimal AI model for your task from 20+ options, optimizing for performance, cost, and capability.',
    canonical: `${SITE_URL}/features/model-routing`,
    ogType: 'article',
  },
  '/features/deep-research': {
    title: `Deep Research - AI with Verifiable Sources | ${SITE_NAME}`,
    description: 'Get comprehensive answers with inline citations from multiple sources. Perfect for research, fact-checking, and in-depth analysis.',
    canonical: `${SITE_URL}/features/deep-research`,
    ogType: 'article',
  },
  '/pricing': {
    title: `Pricing - Simple, Transparent, Fair | ${SITE_NAME}`,
    description: 'Pay-as-you-go pricing with no subscriptions. Use your own API keys or purchase credits that never expire. Full transparency and control.',
    canonical: `${SITE_URL}/pricing`,
    keywords: ['AI pricing', 'AI chat pricing', 'affordable AI', 'pay-as-you-go AI', 'AI credits', 'no subscription AI'],
  },
  '/compare/chofesh-vs-chatgpt': {
    title: `${SITE_NAME} vs ChatGPT - Privacy-First AI Comparison`,
    description: 'Compare local-first, encrypted AI chat with hosted services like ChatGPT. See why privacy-conscious users choose self-hosted solutions.',
    canonical: `${SITE_URL}/compare/chofesh-vs-chatgpt`,
    ogType: 'article',
    keywords: ['AI vs ChatGPT', 'ChatGPT alternative', 'private ChatGPT', 'AI comparison', 'ChatGPT privacy'],
  },
  '/privacy': {
    title: `Privacy Policy | ${SITE_NAME}`,
    description: 'Learn about our commitment to privacy and how we protect your data with local-first architecture and zero data retention.',
    canonical: `${SITE_URL}/privacy`,
  },
  '/terms': {
    title: `Terms of Service | ${SITE_NAME}`,
    description: 'Read our terms of service and understand your rights and responsibilities when using our privacy-first AI platform.',
    canonical: `${SITE_URL}/terms`,
  },
};

function generateMetaTags(path: string): string {
  const metadata = pageMetadata[path];
  if (!metadata) return '';

  const ogType = metadata.ogType || 'website';
  const keywordsTag = metadata.keywords ? `<meta name="keywords" content="${metadata.keywords.join(', ')}" />` : '';

  return `
    <title>${metadata.title}</title>
    <meta name="description" content="${metadata.description}" />
    ${keywordsTag}
    <link rel="canonical" href="${metadata.canonical}" />
    
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${metadata.canonical}" />
    <meta property="og:title" content="${metadata.title}" />
    <meta property="og:description" content="${metadata.description}" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${metadata.title}" />
    <meta name="twitter:description" content="${metadata.description}" />
  `;
}

// Function to apply SEO content to HTML
export function applySeoToHtml(path: string, html: string): string {
  // Only process HTML responses
  if (typeof html === 'string' && html.includes('<!doctype html>')) {
    // Check if this is a marketing page
    if (pageMetadata[path]) {
      // Inject meta tags and structured data into <head>
      const metaTags = generateMetaTags(path);
      const structuredDataScript = getStructuredData(path) || '';
      html = html.replace('</head>', `${metaTags}\n${structuredDataScript}\n  </head>`);

      // Inject visible HTML content into <main id="root">
      const seoContent = seoPageContent[path];
      if (seoContent) {
        html = html.replace(
          '<main id="root"></main>',
          `<main id="root">${seoContent}</main>`
        );
      }
    }
  }
  return html;
}

// Legacy middleware wrapper (kept for compatibility)
export function seoMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;

  res.send = function (data: any): Response {
    if (typeof data === 'string') {
      data = applySeoToHtml(req.path, data);
    }
    return originalSend.call(this, data);
  };

  next();
}

/**
 * Check if a path is a marketing page
 */
export function isMarketingPage(path: string): boolean {
  return path in pageMetadata;
}
