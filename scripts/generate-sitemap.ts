/**
 * Dynamic sitemap generator
 * Generates sitemap.xml from the route registry
 * Run this script before deployment to update the sitemap
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import route registry
import { marketingRoutes } from '../client/src/routes';

const SITE_URL = 'https://chofesh.ai';

function generateSitemap(): string {
  const today = new Date().toISOString().split('T')[0];
  
  const urls = marketingRoutes.map(route => {
    return `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function main() {
  const sitemap = generateSitemap();
  const outputPath = path.resolve(__dirname, '../client/public/sitemap.xml');
  
  fs.writeFileSync(outputPath, sitemap, 'utf-8');
  console.log(`✅ Sitemap generated successfully at ${outputPath}`);
  console.log(`📄 Total URLs: ${marketingRoutes.length}`);
}

main();
