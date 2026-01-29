/**
 * Enhanced Image URL Interceptor
 * 
 * Detects both real temporary image URLs AND fake placeholder URLs,
 * then generates/downloads real images and stores them permanently in S3.
 */

import { storagePut } from "../storage";
import { randomUUID } from "crypto";
import { generateImage } from "./imageGeneration";

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
 * Detect if a URL is a permanent CDN/storage URL that should NOT be modified
 */
function isPermanentUrl(url: string): boolean {
  const permanentDomains = [
    'cdn.example.com',
    'cloudfront.net',
    's3.amazonaws.com',
    'storage.googleapis.com',
    'blob.core.windows.net',
  ];
  
  return permanentDomains.some(domain => url.includes(domain));
}

/**
 * Detect if a URL is a fake placeholder URL (not a real image)
 */
function isFakePlaceholderUrl(url: string): boolean {
  // Check for common placeholder patterns
  const placeholderPatterns = [
    /api\.openai\.com\/v1\/images\/[a-z]{4}-\d{4}$/i, // abcd-1234 format
    /placeholder/i,
    /example\.com\/.*\.(png|jpg|jpeg)/i, // example.com image URLs
    /dummy/i,
  ];
  
  return placeholderPatterns.some(pattern => pattern.test(url));
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
    throw error;
  }
}

/**
 * Extract image description from markdown alt text
 */
function extractImageDescription(markdownImage: string): string {
  const match = markdownImage.match(/!\[(.*?)\]/);
  return match ? match[1] : '';
}

/**
 * Generate a real image from description and store it
 */
async function generateAndStoreImage(description: string): Promise<string> {
  try {
    console.log('[Image Interceptor] Generating real image for fake URL:', description.substring(0, 100));
    
    // Generate image using our image generation system
    const result = await generateImage({
      prompt: description,
    });
    
    if (!result.url) {
      throw new Error('Image generation failed - no URL returned');
    }
    
    console.log('[Image Interceptor] Real image generated:', result.url);
    return result.url;
  } catch (error) {
    console.error('[Image Interceptor] Failed to generate image:', error);
    throw error;
  }
}

/**
 * Find all image URLs in text (markdown format)
 */
function findImageMarkdown(text: string): Array<{ full: string; alt: string; url: string }> {
  const images: Array<{ full: string; alt: string; url: string }> = [];
  
  // Match markdown image syntax: ![alt](url)
  const markdownRegex = /!\[(.*?)\]\((https?:\/\/[^\)]+)\)/g;
  let match;
  while ((match = markdownRegex.exec(text)) !== null) {
    images.push({
      full: match[0],
      alt: match[1],
      url: match[2],
    });
  }
  
  return images;
}

/**
 * Process AI response and replace fake/temporary image URLs with real permanent ones
 */
export async function interceptAndGenerateImages(text: string): Promise<string> {
  const images = findImageMarkdown(text);
  
  if (images.length === 0) {
    return text;
  }
  
  console.log(`[Image Interceptor] Found ${images.length} image references in response`);
  
  let processedText = text;
  
  for (const image of images) {
    try {
      // Skip permanent URLs
      if (isPermanentUrl(image.url)) {
        console.log('[Image Interceptor] Skipping permanent URL:', image.url);
        continue;
      }
      
      let permanentUrl: string;
      
      if (isFakePlaceholderUrl(image.url)) {
        // This is a fake URL - generate a real image from the alt text
        console.log('[Image Interceptor] Detected fake placeholder URL, generating real image');
        permanentUrl = await generateAndStoreImage(image.alt);
      } else if (isTemporaryImageUrl(image.url)) {
        // This is a real but temporary URL - download and store it
        console.log('[Image Interceptor] Detected temporary URL, downloading and storing');
        permanentUrl = await downloadAndStoreImage(image.url);
      } else {
        // This is already a permanent URL - skip it
        continue;
      }
      
      // Replace the entire markdown image with the new URL
      const newMarkdown = `![${image.alt}](${permanentUrl})`;
      processedText = processedText.replace(image.full, newMarkdown);
      
      console.log('[Image Interceptor] Replaced image URL successfully');
    } catch (error) {
      console.error('[Image Interceptor] Failed to process image:', error);
      // Continue with other images even if one fails
    }
  }
  
  return processedText;
}
