/**
 * Marketing Campaign Generator
 * 
 * Generates complete marketing campaigns:
 * - Campaign strategy and positioning
 * - Social media posts (multiple platforms)
 * - Ad copy (Google, Facebook, LinkedIn)
 * - Email sequences
 * - Landing page copy
 * - Marketing assets bundle
 */

import { invokeAICompletion } from '../../_core/aiProviders';
import { generateImage } from '../../_core/imageGeneration';

export interface MarketingCampaignConfig {
  businessName: string;
  product: string;
  targetAudience: string;
  campaignGoal?: 'awareness' | 'leads' | 'sales' | 'engagement';
  budget?: string;
  duration?: string;
}

export interface MarketingCampaignResult {
  campaignName: string;
  strategy: {
    positioning: string;
    messaging: string;
    channels: string[];
    kpis: string[];
  };
  socialMedia: {
    platform: string;
    posts: Array<{
      caption: string;
      hashtags: string[];
      imagePrompt: string;
      imageUrl?: string;
    }>;
  }[];
  ads: {
    platform: string;
    variants: Array<{
      headline: string;
      body: string;
      cta: string;
    }>;
  }[];
  emailSequence: Array<{
    subject: string;
    preview: string;
    body: string;
    cta: string;
    sendDay: number;
  }>;
  landingPage: {
    headline: string;
    subheadline: string;
    sections: Array<{
      title: string;
      content: string;
    }>;
    cta: string;
  };
}

/**
 * Create a complete marketing campaign
 */
export async function createMarketingCampaign(
  config: MarketingCampaignConfig,
  onProgress?: (step: string, progress: number) => void
): Promise<MarketingCampaignResult> {
  
  onProgress?.('Developing campaign strategy...', 10);
  
  // Step 1: Generate campaign strategy
  const strategy = await generateCampaignStrategy(config);
  
  onProgress?.('Creating social media content...', 25);
  
  // Step 2: Generate social media posts
  const socialMedia = await generateSocialMediaPosts(strategy, config);
  
  onProgress?.('Generating social media images...', 45);
  
  // Step 3: Generate images for social posts (limit to 5 images)
  const socialMediaWithImages = await generateSocialImages(socialMedia, config, (imageProgress, total) => {
    onProgress?.(`Generating images... (${imageProgress}/${total})`, 45 + (imageProgress / total) * 20);
  });
  
  onProgress?.('Writing ad copy...', 65);
  
  // Step 4: Generate ad copy for multiple platforms
  const ads = await generateAdCopy(strategy, config);
  
  onProgress?.('Creating email sequence...', 80);
  
  // Step 5: Generate email sequence
  const emailSequence = await generateEmailSequence(strategy, config);
  
  onProgress?.('Writing landing page...', 90);
  
  // Step 6: Generate landing page copy
  const landingPage = await generateLandingPage(strategy, config);
  
  onProgress?.('Complete!', 100);
  
  return {
    campaignName: strategy.campaignName,
    strategy: {
      positioning: strategy.positioning,
      messaging: strategy.messaging,
      channels: strategy.channels,
      kpis: strategy.kpis
    },
    socialMedia: socialMediaWithImages,
    ads,
    emailSequence,
    landingPage
  };
}

/**
 * Generate campaign strategy
 */
async function generateCampaignStrategy(config: MarketingCampaignConfig) {
  const goal = config.campaignGoal || 'awareness';
  
  const prompt = `Create a comprehensive marketing campaign strategy:

Business: ${config.businessName}
Product: ${config.product}
Target Audience: ${config.targetAudience}
Campaign Goal: ${goal}
Budget: ${config.budget || 'flexible'}
Duration: ${config.duration || '30 days'}

Provide:
1. Campaign name (catchy, memorable)
2. Positioning statement
3. Key messaging pillars
4. Recommended channels (social, email, ads, etc.)
5. KPIs to track

Format as JSON:
{
  "campaignName": "Campaign Name",
  "positioning": "How we position the product",
  "messaging": "Core message and value proposition",
  "channels": ["Channel 1", "Channel 2"],
  "kpis": ["KPI 1", "KPI 2"]
}`;

  const response = await invokeAICompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o',
  });

  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to generate campaign strategy');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate social media posts
 */
async function generateSocialMediaPosts(strategy: any, config: MarketingCampaignConfig) {
  const platforms = ['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'TikTok'];
  const socialMedia = [];
  
  for (const platform of platforms) {
    const prompt = `Create 3 engaging ${platform} posts for this campaign:

Campaign: ${strategy.campaignName}
Product: ${config.product}
Target Audience: ${config.targetAudience}
Messaging: ${strategy.messaging}

For each post, provide:
1. Caption (optimized for ${platform})
2. Hashtags (relevant and trending)
3. Image description (for AI generation)

Format as JSON:
{
  "posts": [
    {
      "caption": "Post caption text",
      "hashtags": ["hashtag1", "hashtag2"],
      "imagePrompt": "Detailed description for image generation"
    }
  ]
}`;

    const response = await invokeAICompletion({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o',
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const platformData = JSON.parse(jsonMatch[0]);
      socialMedia.push({
        platform,
        posts: platformData.posts
      });
    }
  }
  
  return socialMedia;
}

/**
 * Generate images for social media posts (limit to 5 total)
 */
async function generateSocialImages(
  socialMedia: any[],
  config: MarketingCampaignConfig,
  onProgress?: (current: number, total: number) => void
) {
  const maxImages = 5; // Limit total images
  let imageCount = 0;
  
  const result = [];
  
  for (const platformData of socialMedia) {
    const postsWithImages = [];
    
    for (const post of platformData.posts) {
      if (imageCount < maxImages) {
        try {
          const imagePrompt = `Social media marketing image: ${post.imagePrompt}
Product: ${config.product}
Style: Professional, eye-catching, modern, high quality
Brand-appropriate for ${config.businessName}`;

          const imageResult = await generateImage({
            prompt: imagePrompt,
          });
          
          postsWithImages.push({
            ...post,
            imageUrl: imageResult.url
          });
          
          imageCount++;
          onProgress?.(imageCount, maxImages);
        } catch (error) {
          console.error(`Failed to generate image for ${platformData.platform}:`, error);
          postsWithImages.push(post);
        }
      } else {
        postsWithImages.push(post);
      }
    }
    
    result.push({
      platform: platformData.platform,
      posts: postsWithImages
    });
  }
  
  return result;
}

/**
 * Generate ad copy for multiple platforms
 */
async function generateAdCopy(strategy: any, config: MarketingCampaignConfig) {
  const adPlatforms = ['Google Ads', 'Facebook Ads', 'LinkedIn Ads'];
  const ads = [];
  
  for (const platform of adPlatforms) {
    const prompt = `Create 3 high-converting ad variants for ${platform}:

Campaign: ${strategy.campaignName}
Product: ${config.product}
Target Audience: ${config.targetAudience}
Messaging: ${strategy.messaging}

For each variant, provide:
1. Headline (attention-grabbing)
2. Body copy (benefit-focused)
3. Call-to-action (action-oriented)

Follow ${platform} best practices and character limits.

Format as JSON:
{
  "variants": [
    {
      "headline": "Headline text",
      "body": "Body copy",
      "cta": "Call to action"
    }
  ]
}`;

    const response = await invokeAICompletion({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o',
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const platformData = JSON.parse(jsonMatch[0]);
      ads.push({
        platform,
        variants: platformData.variants
      });
    }
  }
  
  return ads;
}

/**
 * Generate email sequence
 */
async function generateEmailSequence(strategy: any, config: MarketingCampaignConfig) {
  const prompt = `Create a 5-email nurture sequence for this campaign:

Campaign: ${strategy.campaignName}
Product: ${config.product}
Target Audience: ${config.targetAudience}
Goal: ${config.campaignGoal || 'conversion'}

For each email, provide:
1. Subject line (compelling, open-worthy)
2. Preview text (first line)
3. Body copy (value-focused, conversational)
4. Call-to-action
5. Send day (relative to signup)

Format as JSON array:
[
  {
    "subject": "Email subject",
    "preview": "Preview text",
    "body": "Email body content",
    "cta": "Call to action",
    "sendDay": 0
  }
]`;

  const response = await invokeAICompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o',
  });

  const jsonMatch = response.content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to generate email sequence');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate landing page copy
 */
async function generateLandingPage(strategy: any, config: MarketingCampaignConfig) {
  const prompt = `Create compelling landing page copy for this campaign:

Campaign: ${strategy.campaignName}
Product: ${config.product}
Target Audience: ${config.targetAudience}
Messaging: ${strategy.messaging}

Provide:
1. Hero headline (attention-grabbing)
2. Subheadline (value proposition)
3. Key sections (features, benefits, social proof, FAQ)
4. Primary CTA

Format as JSON:
{
  "headline": "Main headline",
  "subheadline": "Supporting subheadline",
  "sections": [
    {
      "title": "Section title",
      "content": "Section content"
    }
  ],
  "cta": "Primary call to action"
}`;

  const response = await invokeAICompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o',
  });

  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to generate landing page');
  }

  return JSON.parse(jsonMatch[0]);
}
