/**
 * Image URL Interceptor
 * 
 * Automatically detects temporary image URLs in AI responses,
 * downloads them, uploads to S3, and replaces with permanent URLs.
 */

import { storagePut } from "../storage";
import { randomUUID } from "crypto";

/**
 * Detect if a URL is a temporary image URL that should be stored permanently
 */
function isTemporaryImageUrl(url: string): boolean {
  const temporaryDomains = [
    'api.openai.com',
    'oaidalleapiprodscus.blob.core.windows.net',
    'runware.ai',
    'replicate.delivery',
    'stability.ai',
  ];
  
  return temporaryDomains.some(domain => url.includes(domain));
}

/**
 * Download image from URL and upload to S3
 */
async function downloadAndStoreImage(url: string): Promise<string> {
  try {
    console.log('[Image Interceptor] Downloading temporary image:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // Determine file extension from content type
    const ext = contentType.split('/')[1] || 'png';
    const fileName = `intercepted/${Date.now()}-${randomUUID()}.${ext}`;
    
    console.log('[Image Interceptor] Uploading to S3:', fileName);
    const { url: permanentUrl } = await storagePut(
      fileName,
      imageBuffer,
      contentType
    );
    
    console.log('[Image Interceptor] Image stored permanently:', permanentUrl);
    return permanentUrl;
  } catch (error) {
    console.error('[Image Interceptor] Failed to store image:', error);
    // Return original URL if storage fails
    return url;
  }
}

/**
 * Find all image URLs in text (markdown format)
 */
function findImageUrls(text: string): string[] {
  const urls: string[] = [];
  
  // Match markdown image syntax: ![alt](url)
  const markdownRegex = /!\[.*?\]\((https?:\/\/[^\)]+)\)/g;
  let match;
  while ((match = markdownRegex.exec(text)) !== null) {
    urls.push(match[1]);
  }
  
  // Match plain URLs that end with image extensions
  const plainUrlRegex = /https?:\/\/[^\s<>"]+?\.(png|jpg|jpeg|gif|webp|svg)/gi;
  while ((match = plainUrlRegex.exec(text)) !== null) {
    urls.push(match[0]);
  }
  
  // Match OpenAI image URLs specifically
  const openaiRegex = /https?:\/\/api\.openai\.com\/v1\/images\/[^\s<>"]+/g;
  while ((match = openaiRegex.exec(text)) !== null) {
    urls.push(match[0]);
  }
  
  // Remove duplicates
  return [...new Set(urls)];
}

/**
 * Process AI response and replace temporary image URLs with permanent ones
 */
export async function interceptImageUrls(text: string): Promise<string> {
  const imageUrls = findImageUrls(text);
  
  if (imageUrls.length === 0) {
    return text;
  }
  
  console.log(`[Image Interceptor] Found ${imageUrls.length} image URLs in response`);
  
  let processedText = text;
  
  for (const url of imageUrls) {
    if (isTemporaryImageUrl(url)) {
      const permanentUrl = await downloadAndStoreImage(url);
      // Replace all occurrences of the temporary URL with the permanent one
      processedText = processedText.replace(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), permanentUrl);
    }
  }
  
  return processedText;
}
