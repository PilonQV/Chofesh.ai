/**
 * Website Builder
 * 
 * Generates complete websites from descriptions:
 * - Sitemap and structure
 * - Page content and copy
 * - HTML/CSS/JS code
 * - Responsive design
 * - SEO metadata
 */

import { invokeAICompletion } from '../../_core/aiProviders';
import { generateImage } from '../../_core/imageGeneration';

export interface WebsiteConfig {
  businessType: string;
  websiteType?: 'portfolio' | 'ecommerce' | 'blog' | 'landing' | 'business';
  pages?: string[];
  colorScheme?: string;
  style?: 'modern' | 'minimal' | 'bold' | 'elegant' | 'playful';
}

export interface WebsiteResult {
  siteName: string;
  tagline: string;
  sitemap: Array<{
    page: string;
    path: string;
    description: string;
  }>;
  designSystem: {
    colors: Record<string, string>;
    fonts: {
      heading: string;
      body: string;
    };
    style: string;
  };
  pages: Array<{
    name: string;
    path: string;
    html: string;
    css: string;
    js?: string;
    seo: {
      title: string;
      description: string;
      keywords: string[];
    };
  }>;
  assets: {
    logo?: string;
    heroImage?: string;
  };
}

/**
 * Create a complete website
 */
export async function createWebsite(
  config: WebsiteConfig,
  onProgress?: (step: string, progress: number) => void
): Promise<WebsiteResult> {
  
  onProgress?.('Analyzing requirements...', 10);
  
  // Step 1: Generate sitemap and structure
  const sitemap = await generateSitemap(config);
  
  onProgress?.('Creating design system...', 25);
  
  // Step 2: Generate design system (colors, fonts, style)
  const designSystem = await generateDesignSystem(config);
  
  onProgress?.('Generating content...', 40);
  
  // Step 3: Generate content for each page
  const pages = await generatePages(sitemap, designSystem, config, (pageProgress) => {
    onProgress?.(`Generating pages... (${pageProgress}/${sitemap.pages.length})`, 40 + (pageProgress / sitemap.pages.length) * 40);
  });
  
  onProgress?.('Creating assets...', 85);
  
  // Step 4: Generate logo and hero image
  const assets = await generateAssets(sitemap.siteName, designSystem, config);
  
  onProgress?.('Finalizing website...', 95);
  
  // Step 5: Add global CSS and JS
  const finalPages = await addGlobalStyles(pages, designSystem);
  
  onProgress?.('Complete!', 100);
  
  return {
    siteName: sitemap.siteName,
    tagline: sitemap.tagline,
    sitemap: sitemap.pages,
    designSystem,
    pages: finalPages,
    assets
  };
}

/**
 * Generate sitemap and structure
 */
async function generateSitemap(config: WebsiteConfig) {
  const websiteType = config.websiteType || 'business';
  
  const prompt = `Create a sitemap for a ${websiteType} website for: ${config.businessType}

Please provide:
1. Site name (catchy, memorable)
2. Tagline (one sentence value proposition)
3. List of pages with paths and descriptions

Typical pages for ${websiteType}:
${getTypicalPages(websiteType).join(', ')}

Format as JSON:
{
  "siteName": "Site Name",
  "tagline": "Compelling tagline",
  "pages": [
    {"page": "Home", "path": "/", "description": "Homepage with hero and key features"},
    {"page": "About", "path": "/about", "description": "Company story and team"}
  ]
}`;

  const response = await invokeAICompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o-mini',
  });

  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to generate sitemap');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate design system
 */
async function generateDesignSystem(config: WebsiteConfig) {
  const style = config.style || 'modern';
  const colorScheme = config.colorScheme || 'professional';
  
  const prompt = `Create a design system for a ${style} website with ${colorScheme} color scheme.

Provide:
1. Color palette (primary, secondary, accent, background, text)
2. Font pairing (heading and body fonts from Google Fonts)
3. Style guidelines

Format as JSON:
{
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex"
  },
  "fonts": {
    "heading": "Font Name",
    "body": "Font Name"
  },
  "style": "Description of visual style and design principles"
}`;

  const response = await invokeAICompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o-mini',
  });

  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to generate design system');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate pages with HTML/CSS/JS
 */
async function generatePages(
  sitemap: any,
  designSystem: any,
  config: WebsiteConfig,
  onProgress?: (current: number) => void
) {
  const pages = [];
  
  for (let i = 0; i < sitemap.pages.length; i++) {
    const pageInfo = sitemap.pages[i];
    
    const prompt = `Generate a complete HTML page for: ${pageInfo.page}

Website: ${sitemap.siteName}
Description: ${pageInfo.description}
Design System: ${JSON.stringify(designSystem)}

Requirements:
- Modern, responsive HTML5
- Inline CSS using the design system colors and fonts
- Mobile-first design
- Semantic HTML
- Accessibility best practices
- SEO-friendly structure

Include:
- Navigation header with links to all pages
- Main content section
- Footer with copyright
- Responsive breakpoints

Format as JSON:
{
  "html": "<!DOCTYPE html>...",
  "css": "/* Additional page-specific styles */",
  "seo": {
    "title": "Page title",
    "description": "Meta description",
    "keywords": ["keyword1", "keyword2"]
  }
}`;

    const response = await invokeAICompletion({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o', // Use better model for code generation
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const pageData = JSON.parse(jsonMatch[0]);
      pages.push({
        name: pageInfo.page,
        path: pageInfo.path,
        ...pageData
      });
    }
    
    onProgress?.(i + 1);
  }
  
  return pages;
}

/**
 * Generate logo and hero image
 */
async function generateAssets(siteName: string, designSystem: any, config: WebsiteConfig) {
  const assets: any = {};
  
  try {
    // Generate logo
    const logoPrompt = `Professional logo for "${siteName}" - ${config.businessType}
Style: ${designSystem.style}
Colors: ${designSystem.colors.primary}, ${designSystem.colors.secondary}
Design: Clean, modern, scalable vector style, white background`;
    
    const logoResult = await generateImage({
      prompt: logoPrompt,
    });
    assets.logo = logoResult.url;
    
    // Generate hero image
    const heroPrompt = `Hero image for ${config.businessType} website
Style: ${designSystem.style}, professional, high quality
Colors: Complementary to ${designSystem.colors.primary}
Content: Abstract, modern, relevant to ${config.businessType}`;
    
    const heroResult = await generateImage({
      prompt: heroPrompt,
    });
    assets.heroImage = heroResult.url;
    
  } catch (error) {
    console.error('Failed to generate assets:', error);
  }
  
  return assets;
}

/**
 * Add global styles to all pages
 */
async function addGlobalStyles(pages: any[], designSystem: any) {
  const globalCSS = `
/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --color-primary: ${designSystem.colors.primary};
  --color-secondary: ${designSystem.colors.secondary};
  --color-accent: ${designSystem.colors.accent};
  --color-background: ${designSystem.colors.background};
  --color-text: ${designSystem.colors.text};
  --font-heading: '${designSystem.fonts.heading}', sans-serif;
  --font-body: '${designSystem.fonts.body}', sans-serif;
}

body {
  font-family: var(--font-body);
  color: var(--color-text);
  background-color: var(--color-background);
  line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  color: var(--color-primary);
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  color: var(--color-accent);
}

/* Responsive */
@media (max-width: 768px) {
  body {
    font-size: 14px;
  }
}
`;

  return pages.map(page => ({
    ...page,
    css: globalCSS + '\n\n' + (page.css || '')
  }));
}

/**
 * Get typical pages for website type
 */
function getTypicalPages(type: string): string[] {
  const pages: Record<string, string[]> = {
    portfolio: ['Home', 'Portfolio', 'About', 'Contact'],
    ecommerce: ['Home', 'Shop', 'Product', 'Cart', 'Checkout', 'About'],
    blog: ['Home', 'Blog', 'About', 'Contact'],
    landing: ['Home'],
    business: ['Home', 'Services', 'About', 'Contact']
  };
  
  return pages[type] || pages.business;
}
