/**
 * Marketing routes registry
 * Single source of truth for all public marketing pages
 * Used for sitemap generation and prerendering
 */

export interface RouteConfig {
  path: string;
  priority: number;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export const marketingRoutes: RouteConfig[] = [
  {
    path: '/',
    priority: 1.0,
    changefreq: 'weekly',
  },
  {
    path: '/features',
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    path: '/features/private-ai-chat',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: '/features/byok',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: '/features/local-storage',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: '/features/model-routing',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: '/features/deep-research',
    priority: 0.8,
    changefreq: 'monthly',
  },
  {
    path: '/pricing',
    priority: 0.9,
    changefreq: 'monthly',
  },
  {
    path: '/compare/chofesh-vs-chatgpt',
    priority: 0.7,
    changefreq: 'monthly',
  },
  {
    path: '/privacy',
    priority: 0.5,
    changefreq: 'monthly',
  },
  {
    path: '/terms',
    priority: 0.5,
    changefreq: 'monthly',
  },
];

/**
 * Get all marketing route paths for prerendering
 */
export function getMarketingPaths(): string[] {
  return marketingRoutes.map(route => route.path);
}
