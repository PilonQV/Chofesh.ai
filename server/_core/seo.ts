/**
 * SEO Middleware for Express
 * Injects meta tags into HTML for marketing pages
 */

import { type Request, type Response, type NextFunction } from 'express';

interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  ogType?: string;
}

const pageMetadata: Record<string, PageMeta> = {
  '/': {
    title: 'Chofesh — Private AI Chat (Encrypted, Local-First, Multi-Model, BYOK)',
    description: 'Chofesh is a privacy-first AI chat platform that keeps your data on your device. With end-to-end encryption, local storage, BYOK support, and access to 20+ AI models, experience AI without compromising your privacy.',
    canonical: 'https://chofesh.ai/',
    ogType: 'website',
  },
  '/features': {
    title: 'Features - Privacy-First AI Chat Platform | Chofesh',
    description: 'Explore Chofesh features: private AI chat, BYOK, local storage, smart model routing, and deep research. Built for privacy-conscious professionals and developers.',
    canonical: 'https://chofesh.ai/features',
    ogType: 'website',
  },
  '/features/private-ai-chat': {
    title: 'Private AI Chat - Encrypted & Local-First | Chofesh',
    description: 'Learn how Chofesh\'s private AI chat keeps your conversations secure with end-to-end encryption and local storage. Your data stays on your device, always.',
    canonical: 'https://chofesh.ai/features/private-ai-chat',
  },
  '/features/byok': {
    title: 'Bring Your Own Key (BYOK) - AI Model Flexibility | Chofesh',
    description: 'Discover the freedom of Chofesh\'s BYOK feature. Use your own API keys from OpenAI, Anthropic, Google, and more for ultimate control and flexibility.',
    canonical: 'https://chofesh.ai/features/byok',
  },
  '/features/local-storage': {
    title: 'Local Storage - Your Data Stays on Your Device | Chofesh',
    description: 'Learn how Chofesh\'s local-first architecture and local storage feature ensure your data remains private and on your device, always.',
    canonical: 'https://chofesh.ai/features/local-storage',
  },
  '/features/model-routing': {
    title: 'Smart Model Routing - The Best AI for Every Task | Chofesh',
    description: 'Discover how Chofesh\'s Smart Model Routing automatically selects the best AI model for your task, optimizing for speed, cost, and performance.',
    canonical: 'https://chofesh.ai/features/model-routing',
  },
  '/features/deep-research': {
    title: 'Deep Research - AI-Powered Insights with Verifiable Sources | Chofesh',
    description: 'Discover how Chofesh\'s Deep Research feature provides AI-powered summaries with inline citations, delivering in-depth insights and verifiable answers you can trust.',
    canonical: 'https://chofesh.ai/features/deep-research',
  },
  '/pricing': {
    title: 'Pricing - Simple, Transparent, and Fair | Chofesh',
    description: 'Discover Chofesh\'s simple and transparent pay-as-you-go pricing. No subscriptions, no hidden fees, and your credits never expire.',
    canonical: 'https://chofesh.ai/pricing',
  },
  '/compare/chofesh-vs-chatgpt': {
    title: 'Chofesh vs. Hosted AI Chat - A Clear Choice for Privacy',
    description: 'Compare Chofesh\'s local-first, privacy-focused approach to hosted AI chat platforms like ChatGPT. See why Chofesh is the clear choice for data privacy.',
    canonical: 'https://chofesh.ai/compare/chofesh-vs-chatgpt',
  },
  '/privacy': {
    title: 'Privacy Policy | Chofesh',
    description: 'Read Chofesh\'s privacy policy to understand how we protect your data with local-first storage and end-to-end encryption.',
    canonical: 'https://chofesh.ai/privacy',
  },
  '/terms': {
    title: 'Terms of Service | Chofesh',
    description: 'Read Chofesh\'s terms of service to understand our platform policies and user agreements.',
    canonical: 'https://chofesh.ai/terms',
  },
};

function generateMetaTags(meta: PageMeta): string {
  return `
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}">
    <link rel="canonical" href="${meta.canonical}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${meta.ogType || 'article'}">
    <meta property="og:url" content="${meta.canonical}">
    <meta property="og:title" content="${meta.title}">
    <meta property="og:description" content="${meta.description}">
    <meta property="og:site_name" content="Chofesh">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${meta.canonical}">
    <meta property="twitter:title" content="${meta.title}">
    <meta property="twitter:description" content="${meta.description}">
  `;
}

/**
 * SEO middleware that injects meta tags for marketing pages
 */
export function seoMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;
  
  res.send = function(data: any): Response {
    // Only process HTML responses for marketing pages
    if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
      const path = req.path;
      const meta = pageMetadata[path];
      
      if (meta) {
        // Inject meta tags into <head>
        const metaTags = generateMetaTags(meta);
        data = data.replace('</head>', `${metaTags}\n  </head>`);
      }
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
